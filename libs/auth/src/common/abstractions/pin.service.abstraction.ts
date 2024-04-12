import { KdfConfig } from "@bitwarden/common/auth/models/domain/kdf-config";
import { KdfType } from "@bitwarden/common/platform/enums";
import { EncString } from "@bitwarden/common/platform/models/domain/enc-string";
import { UserId } from "@bitwarden/common/types/guid";
import { MasterKey, PinKey, UserKey } from "@bitwarden/common/types/key";

import { PinLockType } from "../services";

export abstract class PinServiceAbstraction {
  /**
   * Gets the user key encrypted by the PIN key.
   * Used when Lock with MP on Restart is disabled
   */
  getPinKeyEncryptedUserKey: (userId?: string) => Promise<EncString>;
  /**
   * Sets the user key encrypted by the PIN key.
   * Used when Lock with MP on Restart is disabled
   */
  setPinKeyEncryptedUserKey: (value: EncString, userId?: string) => Promise<void>;
  /**
   * Gets the ephemeral version of the user key encrypted by the PIN key.
   * Used when Lock with MP on Restart is enabled
   */
  getPinKeyEncryptedUserKeyEphemeral: (userId?: string) => Promise<EncString>;
  /**
   * Sets the ephemeral version of the user key encrypted by the PIN key.
   * Used when Lock with MP on Restart is enabled
   */
  setPinKeyEncryptedUserKeyEphemeral: (value: EncString, userId?: string) => Promise<void>;
  /**
   * Gets the user's Pin, encrypted by the user key
   */
  getProtectedPin: (userId?: UserId) => Promise<string>;
  /**
   * Sets the user's Pin, encrypted by the user key
   */
  setProtectedPin: (value: string, userId?: UserId) => Promise<void>;
  /**
   * Decrypts the user key with their pin
   * @param pin The user's PIN
   * @param salt The user's salt
   * @param kdf The user's KDF
   * @param kdfConfig The user's KDF config
   * @param pinKeyEncryptedUserKey The user's PIN protected symmetric key, if not provided
   * it will be retrieved from storage
   * @returns The decrypted user key
   */
  abstract decryptUserKey(
    pin: string,
    salt: string,
    kdf: KdfType,
    kdfConfig: KdfConfig,
    pinKeyEncryptedUserKey?: EncString,
  ): Promise<UserKey>;
  /**
   * @param pin The user's pin
   * @param salt The user's salt
   * @param kdf The user's kdf
   * @param kdfConfig The user's kdf config
   * @returns A key derived from the user's pin
   */
  abstract makePinKey(
    pin: string,
    salt: string,
    kdf: KdfType,
    kdfConfig: KdfConfig,
  ): Promise<PinKey>;

  /**
   * Creates a new Pin key that encrypts the user key instead of the
   * master key. Clears the old Pin key from state.
   * @param masterPasswordOnRestart True if Master Password on Restart is enabled
   * @param pin User's PIN
   * @param email User's email
   * @param kdf User's KdfType
   * @param kdfConfig User's KdfConfig
   * @param oldPinKeyEncryptedMasterKey The old pin key encrypted master key from state (retrieved from different
   * places depending on if Master Password on Restart was enabled)
   * @returns The user key
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

  /**
   * Stores the pin key if needed. If MP on Reset is enabled, stores the
   * ephemeral version.
   * @param key The user key
   */
  abstract storePinKey: (key: UserKey, userId?: UserId) => Promise<void>;

  /**
   * Has the user enabled unlock with Pin.
   * @param userId The user id to check. If not provided, the current user is used
   * @returns PinLockType
   */
  isPinLockSet: (userId?: string) => Promise<PinLockType>;

  decryptUserKeyWithPin: (pin: string) => Promise<UserKey | null>;
}
