import {
  EMPTY,
  Observable,
  catchError,
  combineLatest,
  defer,
  distinctUntilChanged,
  firstValueFrom,
  from,
  map,
  shareReplay,
  switchMap,
  tap,
} from "rxjs";

import { UserDecryptionOptionsServiceAbstraction } from "@bitwarden/auth/common";

import { VaultTimeoutSettingsService as VaultTimeoutSettingsServiceAbstraction } from "../../abstractions/vault-timeout/vault-timeout-settings.service";
import { PolicyService } from "../../admin-console/abstractions/policy/policy.service.abstraction";
import { PolicyType } from "../../admin-console/enums";
import { Policy } from "../../admin-console/models/domain/policy";
import { TokenService } from "../../auth/abstractions/token.service";
import { VaultTimeoutAction } from "../../enums/vault-timeout-action.enum";
import { CryptoService } from "../../platform/abstractions/crypto.service";
import { LogService } from "../../platform/abstractions/log.service";
import { StateService } from "../../platform/abstractions/state.service";
import { BiometricStateService } from "../../platform/biometrics/biometric-state.service";
import { StateProvider } from "../../platform/state";
import { UserId } from "../../types/guid";

import { VAULT_TIMEOUT, VAULT_TIMEOUT_ACTION } from "./vault-timeout-settings.state";

/**
 * - DISABLED: No Pin set
 * - PERSISTENT: Pin is set and survives client reset
 * - TRANSIENT: Pin is set and requires password unlock after client reset
 */
export type PinLockType = "DISABLED" | "PERSISTANT" | "TRANSIENT";

export class VaultTimeoutSettingsService implements VaultTimeoutSettingsServiceAbstraction {
  constructor(
    private userDecryptionOptionsService: UserDecryptionOptionsServiceAbstraction,
    private cryptoService: CryptoService,
    private tokenService: TokenService,
    private policyService: PolicyService,
    private stateService: StateService,
    private biometricStateService: BiometricStateService,
    private stateProvider: StateProvider,
    private logService: LogService,
  ) {}

  async setVaultTimeoutOptions(
    userId: UserId,
    timeout: number,
    action: VaultTimeoutAction,
  ): Promise<void> {
    // We swap these tokens from being on disk for lock actions, and in memory for logout actions
    // Get them here to set them to their new location after changing the timeout action and clearing if needed
    const accessToken = await this.tokenService.getAccessToken();
    const refreshToken = await this.tokenService.getRefreshToken();
    const clientId = await this.tokenService.getClientId();
    const clientSecret = await this.tokenService.getClientSecret();

    await this.setVaultTimeout(userId, timeout);

    // TODO: ask why we even need to get the current action
    const currentAction = await firstValueFrom(this.getVaultTimeoutActionByUserId$(null));

    if (
      (timeout != null || timeout === 0) &&
      action === VaultTimeoutAction.LogOut &&
      action !== currentAction
    ) {
      // if we have a vault timeout and the action is log out, reset tokens
      await this.tokenService.clearTokens();
    }

    await this.setVaultTimeoutAction(userId, action);

    await this.tokenService.setTokens(accessToken, action, timeout, refreshToken, [
      clientId,
      clientSecret,
    ]);

    await this.cryptoService.refreshAdditionalKeys();
  }

  availableVaultTimeoutActions$(userId?: string) {
    return defer(() => this.getAvailableVaultTimeoutActions(userId));
  }

  async isPinLockSet(userId?: string): Promise<PinLockType> {
    // we can't check the protected pin for both because old accounts only
    // used it for MP on Restart
    const pinIsEnabled = !!(await this.stateService.getProtectedPin({ userId }));
    const aUserKeyPinIsSet = !!(await this.stateService.getPinKeyEncryptedUserKey({ userId }));
    const anOldUserKeyPinIsSet = !!(await this.stateService.getEncryptedPinProtected({ userId }));

    if (aUserKeyPinIsSet || anOldUserKeyPinIsSet) {
      return "PERSISTANT";
    } else if (pinIsEnabled && !aUserKeyPinIsSet && !anOldUserKeyPinIsSet) {
      return "TRANSIENT";
    } else {
      return "DISABLED";
    }
  }

  async isBiometricLockSet(userId?: string): Promise<boolean> {
    const biometricUnlockPromise =
      userId == null
        ? firstValueFrom(this.biometricStateService.biometricUnlockEnabled$)
        : this.biometricStateService.getBiometricUnlockEnabled(userId as UserId);
    return await biometricUnlockPromise;
  }

  private async setVaultTimeout(userId: UserId, timeout: number): Promise<void> {
    await this.stateProvider.setUserState(VAULT_TIMEOUT, timeout, userId);
  }

  getVaultTimeoutByUserId$(userId: UserId): Observable<number> {
    return combineLatest([
      this.stateProvider.getUserState$(VAULT_TIMEOUT, userId),
      this.getMaxVaultTimeoutPolicyByUserId$(userId),
    ]).pipe(
      switchMap(([currentVaultTimeout, maxVaultTimeoutPolicy]) => {
        return from(
          this.determineVaultTimeout(userId, currentVaultTimeout, maxVaultTimeoutPolicy),
        ).pipe(
          tap((vaultTimeout: number) => {
            // As a side effect, set the new value in the state if it's different from the current
            if (vaultTimeout !== currentVaultTimeout) {
              return this.stateProvider.setUserState(VAULT_TIMEOUT, vaultTimeout, userId);
            }
          }),
          catchError((error: unknown) => {
            // Protect outer observable from canceling on error by catching and returning EMPTY
            this.logService.error(`Error getting vault timeout: ${error}`);
            return EMPTY;
          }),
        );
      }),
      distinctUntilChanged(), // Avoid having the set side effect trigger a new emission of the same action
      shareReplay({ refCount: true, bufferSize: 1 }),
    );
  }

  private async determineVaultTimeout(
    userId: UserId,
    currentVaultTimeout: number,
    maxVaultTimeoutPolicy: Policy | null,
  ): Promise<number> {
    if (maxVaultTimeoutPolicy) {
      const maxVaultTimeoutPolicyData = maxVaultTimeoutPolicy.data;

      // Remove negative values, and ensure it's smaller than maximum allowed value according to policy
      let policyCompliantTimeout = Math.min(currentVaultTimeout, maxVaultTimeoutPolicyData.minutes);

      if (currentVaultTimeout == null || policyCompliantTimeout < 0) {
        policyCompliantTimeout = maxVaultTimeoutPolicyData.minutes;
      }

      return policyCompliantTimeout;
    }

    return currentVaultTimeout;
  }

  private async setVaultTimeoutAction(userId: UserId, action: VaultTimeoutAction): Promise<void> {
    await this.stateProvider.setUserState(VAULT_TIMEOUT_ACTION, action, userId);
  }

  getVaultTimeoutActionByUserId$(userId: UserId): Observable<VaultTimeoutAction> {
    return combineLatest([
      this.stateProvider.getUserState$(VAULT_TIMEOUT_ACTION, userId),
      this.getMaxVaultTimeoutPolicyByUserId$(userId),
    ]).pipe(
      switchMap(([currentVaultTimeoutAction, maxVaultTimeoutPolicy]) => {
        return from(
          this.determineVaultTimeoutAction(
            userId,
            currentVaultTimeoutAction,
            maxVaultTimeoutPolicy,
          ),
        ).pipe(
          tap((vaultTimeoutAction: VaultTimeoutAction) => {
            // As a side effect, set the new value in the state if it's different from the current
            // We want to avoid having a null timeout action always so we set it to the default if it is null
            // and if the user becomes subject to a policy that requires a specific action, we set it to that
            if (vaultTimeoutAction !== currentVaultTimeoutAction) {
              return this.stateProvider.setUserState(
                VAULT_TIMEOUT_ACTION,
                vaultTimeoutAction,
                userId,
              );
            }
          }),
          catchError((error: unknown) => {
            // Protect outer observable from canceling on error by catching and returning EMPTY
            this.logService.error(`Error getting vault timeout: ${error}`);
            return EMPTY;
          }),
        );
      }),
      distinctUntilChanged(), // Avoid having the set side effect trigger a new emission of the same action
      shareReplay({ refCount: true, bufferSize: 1 }),
    );
  }

  private async determineVaultTimeoutAction(
    userId: string,
    currentVaultTimeoutAction: VaultTimeoutAction | null,
    maxVaultTimeoutPolicy: Policy | null,
  ): Promise<VaultTimeoutAction> {
    const availableVaultTimeoutActions = await this.getAvailableVaultTimeoutActions();
    if (availableVaultTimeoutActions.length === 1) {
      return availableVaultTimeoutActions[0];
    }

    if (
      maxVaultTimeoutPolicy?.data?.action &&
      availableVaultTimeoutActions.includes(maxVaultTimeoutPolicy.data.action)
    ) {
      // return policy defined vault timeout action
      return maxVaultTimeoutPolicy.data.action;
    }

    // No policy applies, default based on master password if no action is set
    if (currentVaultTimeoutAction == null) {
      // Depends on whether or not the user has a master password
      const defaultVaultTimeoutAction = (await this.userHasMasterPassword(userId))
        ? VaultTimeoutAction.Lock
        : VaultTimeoutAction.LogOut;

      return defaultVaultTimeoutAction;
    }

    return currentVaultTimeoutAction;
  }

  private getMaxVaultTimeoutPolicyByUserId$(userId: UserId): Observable<Policy | null> {
    return this.policyService
      .getAll$(PolicyType.MaximumVaultTimeout, userId)
      .pipe(map((policies) => policies[0] ?? null));
  }

  private async getAvailableVaultTimeoutActions(userId?: string): Promise<VaultTimeoutAction[]> {
    const availableActions = [VaultTimeoutAction.LogOut];

    const canLock =
      (await this.userHasMasterPassword(userId)) ||
      (await this.isPinLockSet(userId)) !== "DISABLED" ||
      (await this.isBiometricLockSet(userId));

    if (canLock) {
      availableActions.push(VaultTimeoutAction.Lock);
    }

    return availableActions;
  }

  async clear(userId?: string): Promise<void> {
    await this.stateService.setEverBeenUnlocked(false, { userId: userId });
    await this.cryptoService.clearPinKeys(userId);
  }

  private async userHasMasterPassword(userId: string): Promise<boolean> {
    if (userId) {
      const decryptionOptions = await firstValueFrom(
        this.userDecryptionOptionsService.userDecryptionOptionsById$(userId),
      );

      if (decryptionOptions?.hasMasterPassword != undefined) {
        return decryptionOptions.hasMasterPassword;
      }
    }
    return await firstValueFrom(this.userDecryptionOptionsService.hasMasterPassword$);
  }
}
