import { Observable } from "rxjs";

import { UserId } from "../../types/guid";

/**
 * Holds information about an account for use in the AccountService
 * if more information is added, be sure to update the equality method.
 */
export type AccountInfo = {
  email: string;
  emailVerified: boolean;
  name: string | undefined;
};

export function accountInfoEqual(a: AccountInfo, b: AccountInfo) {
  if (a == null && b == null) {
    return true;
  }
  const keys = new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})]) as Set<
    keyof AccountInfo
  >;
  for (const key of keys) {
    if (a?.[key] !== b?.[key]) {
      return false;
    }
  }
  return true;
}

export abstract class AccountService {
  accounts$: Observable<Record<UserId, AccountInfo>>;
  activeAccount$: Observable<{ id: UserId | undefined } & AccountInfo>;
  accountActivity$: Observable<Record<UserId, Date>>;
  /**
   * Updates the `accounts$` observable with the new account data.
   * @param userId
   * @param accountData
   */
  abstract addAccount(userId: UserId, accountData: AccountInfo): Promise<void>;
  /**
   * updates the `accounts$` observable with the new preferred name for the account.
   * @param userId
   * @param name
   */
  abstract setAccountName(userId: UserId, name: string): Promise<void>;
  /**
   * updates the `accounts$` observable with the new email for the account.
   * @param userId
   * @param email
   */
  abstract setAccountEmail(userId: UserId, email: string): Promise<void>;
  /**
   * updates the `accounts$` observable with the new email verification status for the account.
   * @param userId
   * @param emailVerified
   */
  abstract setAccountEmailVerified(userId: UserId, emailVerified: boolean): Promise<void>;
  /**
   * Updates the `activeAccount$` observable with the new active account.
   * @param userId
   */
  abstract switchAccount(userId: UserId): Promise<void>;
  /**
   * Cleans personal information for the given account from the `accounts$` observable. Does not remove the userId from the observable.
   * @param userId
   */
  abstract clean(userId: UserId): Promise<void>;
  /**
   * Updates the given user's last activity time.
   * @param userId
   * @param lastActivity
   */
  abstract setAccountActivity(userId: UserId, lastActivity: Date): Promise<void>;
}

export abstract class InternalAccountService extends AccountService {
  abstract delete(): void;
}
