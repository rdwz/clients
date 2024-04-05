import { firstValueFrom } from "rxjs";

import { VaultTimeoutSettingsService } from "@bitwarden/common/abstractions/vault-timeout/vault-timeout-settings.service";
import { KdfConfig } from "@bitwarden/common/auth/models/domain/kdf-config";
import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";
import { KdfType } from "@bitwarden/common/platform/enums";
import { EncString, EncryptedString } from "@bitwarden/common/platform/models/domain/enc-string";
import {
  CRYPTO_DISK,
  CRYPTO_MEMORY,
  StateProvider,
  UserKeyDefinition,
} from "@bitwarden/common/platform/state";
import { PinLockType } from "@bitwarden/common/services/vault-timeout/vault-timeout-settings.service";
import { UserId } from "@bitwarden/common/types/guid";
import { UserKey } from "@bitwarden/common/types/key";

import { PinServiceAbstraction } from "../../abstractions/pin.service.abstraction";

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
  clearOn: [], // TODO: verify
});

export class PinService implements PinServiceAbstraction {
  constructor(
    private stateProvider: StateProvider,
    private stateService: StateService,
    private cryptoService: CryptoService,
    private vaultTimeoutSettingsService: VaultTimeoutSettingsService,
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

  async decryptUserKeyWithPin(pin: string): Promise<UserKey | null> {
    try {
      const pinLockType: PinLockType = await this.vaultTimeoutSettingsService.isPinLockSet();

      const { pinKeyEncryptedUserKey, oldPinKeyEncryptedMasterKey } =
        await this.getPinKeyEncryptedKeys(pinLockType);

      const kdf: KdfType = await this.stateService.getKdfType();
      const kdfConfig: KdfConfig = await this.stateService.getKdfConfig();
      let userKey: UserKey;
      const email = await this.stateService.getEmail();
      if (oldPinKeyEncryptedMasterKey) {
        userKey = await this.cryptoService.decryptAndMigrateOldPinKey(
          pinLockType === "TRANSIENT",
          pin,
          email,
          kdf,
          kdfConfig,
          oldPinKeyEncryptedMasterKey,
        );
      } else {
        userKey = await this.cryptoService.decryptUserKeyWithPin(
          pin,
          email,
          kdf,
          kdfConfig,
          pinKeyEncryptedUserKey,
        );
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

  // Note: oldPinKeyEncryptedMasterKey is only used for migrating old pin keys
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

  private async validatePin(userKey: UserKey, pin: string): Promise<boolean> {
    const protectedPin = await this.getProtectedPin();
    const decryptedPin = await this.cryptoService.decryptToUtf8(
      new EncString(protectedPin),
      userKey,
    );
    return decryptedPin === pin;
  }
}
