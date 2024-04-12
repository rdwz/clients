import { firstValueFrom } from "rxjs";

import { InternalMasterPasswordServiceAbstraction } from "@bitwarden/common/auth/abstractions/master-password.service.abstraction";
import { KdfConfig } from "@bitwarden/common/auth/models/domain/kdf-config";
import { EncryptService } from "@bitwarden/common/platform/abstractions/encrypt.service";
import { KeyGenerationService } from "@bitwarden/common/platform/abstractions/key-generation.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";
import { KdfType } from "@bitwarden/common/platform/enums";
import { EncString, EncryptedString } from "@bitwarden/common/platform/models/domain/enc-string";
import { SymmetricCryptoKey } from "@bitwarden/common/platform/models/domain/symmetric-crypto-key";
import {
  CRYPTO_DISK,
  CRYPTO_MEMORY,
  StateProvider,
  UserKeyDefinition,
} from "@bitwarden/common/platform/state";
import { UserId } from "@bitwarden/common/types/guid";
import { MasterKey, PinKey, UserKey } from "@bitwarden/common/types/key";

import { PinServiceAbstraction } from "../../abstractions/pin.service.abstraction";

/**
 * - DISABLED   : No PIN set.
 * - PERSISTENT : PIN is set and persists through client reset.
 * - TRANSIENT  : PIN is set, but does not persist through client reset.
 *                After client reset the master password is required to unlock.
 */
export type PinLockType = "DISABLED" | "PERSISTANT" | "TRANSIENT";

const PIN_KEY_ENCRYPTED_USER_KEY = new UserKeyDefinition<EncryptedString>(
  CRYPTO_DISK,
  "pinKeyEncryptedUserKey",
  {
    deserializer: (value) => value,
    clearOn: [],
  },
);

const PIN_KEY_ENCRYPTED_USER_KEY_EPHEMERAL = new UserKeyDefinition<EncryptedString>(
  CRYPTO_MEMORY,
  "pinKeyEncryptedUserKeyEphemeral",
  {
    deserializer: (value) => value,
    clearOn: ["logout"],
  },
);

const PROTECTED_PIN = new UserKeyDefinition<string>(CRYPTO_DISK, "protectedPin", {
  deserializer: (value) => value,
  clearOn: [], // TODO-rr-bw: verify
});

export class PinService implements PinServiceAbstraction {
  constructor(
    private stateProvider: StateProvider,
    private stateService: StateService,
    private masterPasswordService: InternalMasterPasswordServiceAbstraction,
    private keyGenerationService: KeyGenerationService,
    private encryptService: EncryptService,
    private logService: LogService,
  ) {}

  async getPinKeyEncryptedUserKey(userId?: UserId): Promise<EncString> {
    return EncString.fromJSON(
      await firstValueFrom(this.stateProvider.getUserState$(PIN_KEY_ENCRYPTED_USER_KEY, userId)),
    );
  }

  async setPinKeyEncryptedUserKey(value: EncString, userId?: UserId): Promise<void> {
    await this.stateProvider.setUserState(
      PIN_KEY_ENCRYPTED_USER_KEY,
      value?.encryptedString,
      userId,
    );
  }

  async getPinKeyEncryptedUserKeyEphemeral(userId?: UserId): Promise<EncString> {
    return EncString.fromJSON(
      await firstValueFrom(
        this.stateProvider.getUserState$(PIN_KEY_ENCRYPTED_USER_KEY_EPHEMERAL, userId),
      ),
    );
  }

  async setPinKeyEncryptedUserKeyEphemeral(value: EncString, userId?: UserId): Promise<void> {
    await this.stateProvider.setUserState(
      PIN_KEY_ENCRYPTED_USER_KEY_EPHEMERAL,
      value?.encryptedString,
      userId,
    );
  }

  async getProtectedPin(userId?: UserId): Promise<string> {
    return await firstValueFrom(this.stateProvider.getUserState$(PROTECTED_PIN, userId));
  }

  async setProtectedPin(value: string, userId?: UserId): Promise<void> {
    await this.stateProvider.setUserState(PROTECTED_PIN, value, userId);
  }

  async storePinKeyEncryptedUserKey(userKey: UserKey, userId?: UserId) {
    const pin = await this.encryptService.decryptToUtf8(
      new EncString(await this.getProtectedPin(userId)),
      userKey,
    );

    const pinKey = await this.makePinKey(
      pin,
      await this.stateService.getEmail({ userId: userId }),
      await this.stateService.getKdfType({ userId: userId }),
      await this.stateService.getKdfConfig({ userId: userId }),
    );

    const pinKeyEncryptedUserKey = await this.encryptService.encrypt(userKey.key, pinKey);

    if ((await this.getPinKeyEncryptedUserKey(userId)) != null) {
      await this.setPinKeyEncryptedUserKey(pinKeyEncryptedUserKey, userId);
    } else {
      await this.setPinKeyEncryptedUserKeyEphemeral(pinKeyEncryptedUserKey, userId);
    }
  }

  async makePinKey(pin: string, salt: string, kdf: KdfType, kdfConfig: KdfConfig): Promise<PinKey> {
    const pinKey = await this.keyGenerationService.deriveKeyFromPassword(pin, salt, kdf, kdfConfig);
    return (await this.keyGenerationService.stretchKey(pinKey)) as PinKey;
  }

  async isPinLockSet(userId?: string): Promise<PinLockType> {
    // we can't check the protected pin for both because old accounts only
    // used it for MP on Restart
    const aUserKeyEncryptedPinIsSet = !!(await this.getProtectedPin(userId as UserId));
    const aPinKeyEncryptedUserKeyIsSet = !!(await this.getPinKeyEncryptedUserKey(userId as UserId));
    const anOldPinKeyEncryptedMasterKeyIsSet = !!(await this.stateService.getEncryptedPinProtected({
      userId,
    }));

    if (aPinKeyEncryptedUserKeyIsSet || anOldPinKeyEncryptedMasterKeyIsSet) {
      return "PERSISTANT";
    } else if (
      aUserKeyEncryptedPinIsSet &&
      !aPinKeyEncryptedUserKeyIsSet &&
      !anOldPinKeyEncryptedMasterKeyIsSet
    ) {
      return "TRANSIENT";
    } else {
      return "DISABLED";
    }
  }

  async decryptAndMigrateOldPinKey(
    masterPasswordOnRestart: boolean,
    pin: string,
    email: string,
    kdf: KdfType,
    kdfConfig: KdfConfig,
    oldPinKeyEncryptedMasterKey: EncString,
  ): Promise<UserKey> {
    // Decrypt
    const masterKey = await this.decryptMasterKeyWithPin(
      pin,
      email,
      kdf,
      kdfConfig,
      oldPinKeyEncryptedMasterKey,
    );
    const encUserKey = await this.stateService.getEncryptedCryptoSymmetricKey();
    const userKey = await this.masterPasswordService.decryptUserKeyWithMasterKey(
      masterKey,
      new EncString(encUserKey),
    );

    // Migrate
    const pinKey = await this.makePinKey(pin, email, kdf, kdfConfig);
    const pinKeyEncryptedUserKey = await this.encryptService.encrypt(userKey.key, pinKey);

    if (masterPasswordOnRestart) {
      await this.stateService.setDecryptedPinProtected(null);
      await this.setPinKeyEncryptedUserKeyEphemeral(pinKeyEncryptedUserKey);
    } else {
      await this.stateService.setEncryptedPinProtected(null);
      await this.setPinKeyEncryptedUserKey(pinKeyEncryptedUserKey);
      // We previously only set the protected pin if MP on Restart was enabled
      // now we set it regardless
      const userKeyEncryptedPin = await this.encryptService.encrypt(pin, userKey);
      await this.setProtectedPin(userKeyEncryptedPin.encryptedString);
    }

    // This also clears the old Biometrics key since the new Biometrics key will
    // be created when the user key is set.
    await this.stateService.setCryptoMasterKeyBiometric(null);

    return userKey;
  }

  // only for migration purposes
  async decryptMasterKeyWithPin(
    pin: string,
    salt: string,
    kdf: KdfType,
    kdfConfig: KdfConfig,
    pinKeyEncryptedMasterKey?: EncString,
  ): Promise<MasterKey> {
    if (!pinKeyEncryptedMasterKey) {
      const pinKeyEncryptedMasterKeyString = await this.stateService.getEncryptedPinProtected();

      if (pinKeyEncryptedMasterKeyString == null) {
        throw new Error("No PIN encrypted key found.");
      }

      pinKeyEncryptedMasterKey = new EncString(pinKeyEncryptedMasterKeyString);
    }

    const pinKey = await this.makePinKey(pin, salt, kdf, kdfConfig);
    const masterKey = await this.encryptService.decryptToBytes(pinKeyEncryptedMasterKey, pinKey);

    return new SymmetricCryptoKey(masterKey) as MasterKey;
  }

  async decryptUserKeyWithPin(pin: string): Promise<UserKey | null> {
    try {
      const pinLockType: PinLockType = await this.isPinLockSet();

      const { pinKeyEncryptedUserKey, oldPinKeyEncryptedMasterKey } =
        await this.getPinKeyEncryptedKeys(pinLockType);

      const kdf: KdfType = await this.stateService.getKdfType();
      const kdfConfig: KdfConfig = await this.stateService.getKdfConfig();
      let userKey: UserKey;
      const email = await this.stateService.getEmail();

      if (oldPinKeyEncryptedMasterKey) {
        userKey = await this.decryptAndMigrateOldPinKey(
          pinLockType === "TRANSIENT",
          pin,
          email,
          kdf,
          kdfConfig,
          oldPinKeyEncryptedMasterKey,
        );
      } else {
        userKey = await this.decryptUserKey(pin, email, kdf, kdfConfig, pinKeyEncryptedUserKey);
      }

      if (!userKey) {
        this.logService.warning(`User key null after pin key decryption.`);
        return null;
      }

      if (!(await this.validatePin(userKey, pin))) {
        this.logService.warning(`Pin key decryption successful but pin validation failed.`);
        return null;
      }

      return userKey;
    } catch (error) {
      this.logService.error(`Error decrypting user key with pin: ${error}`);
      return null;
    }
  }

  // Note: oldPinKeyEncryptedMasterKey (aka "pinProtected") is only used for migrating old pin keys
  // and will be null for all migrated accounts
  private async getPinKeyEncryptedKeys(
    pinLockType: PinLockType,
  ): Promise<{ pinKeyEncryptedUserKey: EncString; oldPinKeyEncryptedMasterKey?: EncString }> {
    switch (pinLockType) {
      case "PERSISTANT": {
        const pinKeyEncryptedUserKey = await this.getPinKeyEncryptedUserKey();
        const oldPinKeyEncryptedMasterKey = await this.stateService.getEncryptedPinProtected();
        return {
          pinKeyEncryptedUserKey,
          oldPinKeyEncryptedMasterKey: oldPinKeyEncryptedMasterKey
            ? new EncString(oldPinKeyEncryptedMasterKey)
            : undefined,
        };
      }
      case "TRANSIENT": {
        const pinKeyEncryptedUserKey = await this.getPinKeyEncryptedUserKeyEphemeral();
        const oldPinKeyEncryptedMasterKey = await this.stateService.getDecryptedPinProtected();
        return { pinKeyEncryptedUserKey, oldPinKeyEncryptedMasterKey };
      }
      case "DISABLED":
        throw new Error("Pin is disabled");
      default: {
        // Compile-time check for exhaustive switch
        const _exhaustiveCheck: never = pinLockType;
        return _exhaustiveCheck;
      }
    }
  }

  async decryptUserKey(
    pin: string,
    salt: string,
    kdf: KdfType,
    kdfConfig: KdfConfig,
    pinKeyEncryptedUserKey?: EncString,
  ): Promise<UserKey> {
    pinKeyEncryptedUserKey ||= await this.getPinKeyEncryptedUserKey();
    pinKeyEncryptedUserKey ||= await this.getPinKeyEncryptedUserKeyEphemeral();

    if (!pinKeyEncryptedUserKey) {
      throw new Error("No PIN encrypted key found.");
    }

    const pinKey = await this.makePinKey(pin, salt, kdf, kdfConfig);
    const userKey = await this.encryptService.decryptToBytes(pinKeyEncryptedUserKey, pinKey);

    return new SymmetricCryptoKey(userKey) as UserKey;
  }

  // TODO-rr-bw: add jsdocs
  private async validatePin(userKey: UserKey, pin: string): Promise<boolean> {
    const protectedPin = await this.getProtectedPin();
    const decryptedPin = await this.encryptService.decryptToUtf8(
      new EncString(protectedPin),
      userKey,
    );

    return decryptedPin === pin;
  }
}
