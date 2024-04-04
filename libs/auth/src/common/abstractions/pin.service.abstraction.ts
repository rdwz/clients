import { EncString } from "@bitwarden/common/platform/models/domain/enc-string";
import { UserKey } from "@bitwarden/common/types/key";

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

  decryptUserKeyWithPin: (pin: string) => Promise<UserKey | null>;
}
