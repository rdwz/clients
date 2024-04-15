import { KdfConfig } from "@bitwarden/common/auth/models/domain/kdf-config";
import { KdfType } from "@bitwarden/common/platform/enums";
import { EncString } from "@bitwarden/common/platform/models/domain/enc-string";
import { UserId } from "@bitwarden/common/types/guid";
import { MasterKey, PinKey, UserKey } from "@bitwarden/common/types/key";

import { PinLockType } from "../services";

export abstract class PinServiceAbstraction {
  /**
   * Gets the UserKey, encrypted by the PinKey.
   * @remarks Persists through a client reset.
   *          Used when require lock with MP on client restart is disabled.
   *          {@link SetPinComponent.setPinForm.masterPassOnRestart}
   */
  getPinKeyEncryptedUserKey: (userId?: UserId) => Promise<EncString>;

  /**
   * Sets the UserKey, encrypted by the PinKey.
   * @remarks Persists through a client reset.
   *          Used when require lock with MP on client restart is disabled.
   *          {@link SetPinComponent.setPinForm.masterPassOnRestart}
   */
  setPinKeyEncryptedUserKey: (value: EncString, userId?: UserId) => Promise<void>;

  /**
   * Gets the ephemeral ("short-lived") version of the UserKey, encrypted by the PinKey.
   * @remarks Does not persist through a client reset.
   *          Used when require lock with MP on client restart is enabled.
   *          {@link SetPinComponent.setPinForm.masterPassOnRestart}
   */
  getPinKeyEncryptedUserKeyEphemeral: (userId?: UserId) => Promise<EncString>;

  /**
   * Sets the ephemeral ("short-lived") version of the UserKey, encrypted by the PinKey.
   * @remarks Does not persist through a client reset.
   *          Used when require lock with MP on client restart is enabled.
   *          {@link SetPinComponent.setPinForm.masterPassOnRestart}
   */
  setPinKeyEncryptedUserKeyEphemeral: (value: EncString, userId?: UserId) => Promise<void>;

  /**
   * Gets the user's PIN, encrypted by the UserKey
   */
  getProtectedPin: (userId?: UserId) => Promise<string>;

  /**
   * Sets the user's PIN, encrypted by the UserKey
   */
  setProtectedPin: (protectedPin: string, userId?: UserId) => Promise<void>;

  /**
   * Stores the UserKey, encrypted by the PinKey
   * - If require MP on client reset is disabled, stores the persistant version via {@link getPinKeyEncryptedUserKey}
   * - If require MP on client reset is enabled, stores the ephemeral version via {@link getPinKeyEncryptedUserKeyEphemeral}
   * TODO-rr-bw: rename method? the name is very similar to getPinKeyEncryptedUserKey(), which only stores the persistant version
   * TODO-rr-bw: OR consider moving back to CryptoService within the storeAdditionalKeys() method since it is only used there once
   */
  storePinKeyEncryptedUserKey: (userKey: UserKey, userId?: UserId) => Promise<void>;

  /**
   * Makes a PinKey from the provided PIN
   */
  makePinKey: (pin: string, salt: string, kdf: KdfType, kdfConfig: KdfConfig) => Promise<PinKey>;

  /**
   * Gets the user's PinLockType
   * @param userId The user id to check. If not provided, the current user is used
   * TODO-rr-bw: verify
   */
  getPinLockType: (userId?: UserId) => Promise<PinLockType>;

  /**
   * Declares whether or not the user has a PIN set (either persistant or ephemeral)
   * @param userId The user id to check. If not provided, the current user is used
   * TODO-rr-bw: verify
   */
  isPinSet: (userId?: UserId) => Promise<boolean>;

  // TODO-rr-bw: add jsdocs
  decryptUserKeyWithPin: (pin: string) => Promise<UserKey | null>;

  /**
   * Decrypts the UserKey with provided the PIN
   * @param pin User's PIN
   * @param salt User's salt
   * @param kdf User's KDF
   * @param kdfConfig User's KDF config
   * @param pinKeyEncryptedUserKey The UserKey, encrypted by the PinKey. If not provided it will be retrieved from storage.
   * @returns The decrypted UserKey
   */
  decryptUserKey: (
    pin: string,
    salt: string,
    kdf: KdfType,
    kdfConfig: KdfConfig,
    pinKeyEncryptedUserKey?: EncString,
  ) => Promise<UserKey>;

  /**
   * Creates a new PinKey that encrypts the UserKey instead of encrypting the MasterKey. Clears the old PinKey from state.
   * @param masterPasswordOnRestart True if Master Password on Restart is enabled
   * @param pin User's PIN
   * @param email User's email
   * @param kdf User's KdfType
   * @param kdfConfig User's KdfConfig
   * @param oldPinKeyEncryptedMasterKey The old PinKey encrypted MasterKey from state (retrieved from different
   * places depending on if Master Password on Restart was enabled)
   * @returns The UserKey
   */
  abstract decryptAndMigrateOldPinKey(
    masterPasswordOnRestart: boolean,
    pin: string,
    email: string,
    kdf: KdfType,
    kdfConfig: KdfConfig,
    oldPinKeyEncryptedMasterKey: EncString,
  ): Promise<UserKey>;

  /**
   * @deprecated Left for migration purposes. Use decryptUserKeyWithPin instead.
   */
  abstract decryptMasterKeyWithPin(
    pin: string,
    salt: string,
    kdf: KdfType,
    kdfConfig: KdfConfig,
    protectedKeyCs?: EncString,
  ): Promise<MasterKey>;
}
