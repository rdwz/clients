import { Observable } from "rxjs";

import { VaultTimeoutAction } from "../../enums/vault-timeout-action.enum";
import { PinLockType } from "../../services/vault-timeout/vault-timeout-settings.service";
import { UserId } from "../../types/guid";

export abstract class VaultTimeoutSettingsService {
  /**
   * Set the vault timeout options for the user
   * @param vaultTimeout The vault timeout in minutes
   * @param vaultTimeoutAction The vault timeout action
   * @param userId The user id to set the data for.
   */
  setVaultTimeoutOptions: (
    userId: UserId,
    vaultTimeout: number,
    vaultTimeoutAction: VaultTimeoutAction,
  ) => Promise<void>;

  /**
   * Get the available vault timeout actions for the current user
   *
   * **NOTE:** This observable is not yet connected to the state service, so it will not update when the state changes
   * @param userId The user id to check. If not provided, the current user is used
   */
  availableVaultTimeoutActions$: (userId?: string) => Observable<VaultTimeoutAction[]>;

  /**
   * Gets the vault timeout action for the given user id. The returned value is
   * calculated based on the current state, if a max vault timeout policy applies to the user,
   * and what the user's available unlock methods are.
   *
   * A new action will be emitted if the current state changes or if the user's policy changes and the new policy affect the action.
   * @param userId - the user id to get the vault timeout action for
   */
  getVaultTimeoutActionByUserId$: (userId: string) => Observable<VaultTimeoutAction>;

  /**
   * Get the vault timeout for the given user id. The returned value is calculated based on the current state
   * and if a max vault timeout policy applies to the user.
   * @param userId The user id to get the vault timeout for
   */
  getVaultTimeoutByUserId$: (userId: string) => Observable<number>;

  /**
   * Has the user enabled unlock with Pin.
   * @param userId The user id to check. If not provided, the current user is used
   * @returns PinLockType
   */
  isPinLockSet: (userId?: string) => Promise<PinLockType>;

  /**
   * Has the user enabled unlock with Biometric.
   * @param userId The user id to check. If not provided, the current user is used
   * @returns boolean true if biometric lock is set
   */
  isBiometricLockSet: (userId?: string) => Promise<boolean>;

  clear: (userId?: string) => Promise<void>;
}
