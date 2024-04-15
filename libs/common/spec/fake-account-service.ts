import { mock } from "jest-mock-extended";
import { ReplaySubject } from "rxjs";

import { AccountInfo, AccountService } from "../src/auth/abstractions/account.service";
import { UserId } from "../src/types/guid";

export function mockAccountServiceWith(
  userId: UserId,
  info: Partial<AccountInfo> = {},
  activity: Record<UserId, Date> = {},
): FakeAccountService {
  const fullInfo: AccountInfo = {
    ...info,
    ...{
      name: "name",
      email: "email",
      emailVerified: true,
    },
  };

  const fullActivity = { [userId]: new Date(), ...activity };

  const service = new FakeAccountService({ [userId]: fullInfo }, fullActivity);
  service.activeAccountSubject.next({ id: userId, ...fullInfo });
  return service;
}

export class FakeAccountService implements AccountService {
  mock = mock<AccountService>();
  // eslint-disable-next-line rxjs/no-exposed-subjects -- test class
  accountsSubject = new ReplaySubject<Record<UserId, AccountInfo>>(1);
  // eslint-disable-next-line rxjs/no-exposed-subjects -- test class
  activeAccountSubject = new ReplaySubject<{ id: UserId } & AccountInfo>(1);
  // eslint-disable-next-line rxjs/no-exposed-subjects -- test class
  accountActivitySubject = new ReplaySubject<Record<UserId, Date>>(1);
  private _activeUserId: UserId;
  get activeUserId() {
    return this._activeUserId;
  }
  accounts$ = this.accountsSubject.asObservable();
  activeAccount$ = this.activeAccountSubject.asObservable();
  accountActivity$ = this.accountActivitySubject.asObservable();

  constructor(initialData: Record<UserId, AccountInfo>, accountActivity?: Record<UserId, Date>) {
    this.accountsSubject.next(initialData);
    this.activeAccountSubject.subscribe((data) => (this._activeUserId = data?.id));
    this.activeAccountSubject.next(null);
    this.accountActivitySubject.next(accountActivity);
  }
  async setAccountActivity(userId: UserId, lastActivity: Date): Promise<void> {
    await this.mock.setAccountActivity(userId, lastActivity);
  }

  async addAccount(userId: UserId, accountData: AccountInfo): Promise<void> {
    const current = this.accountsSubject["_buffer"][0] ?? {};
    this.accountsSubject.next({ ...current, [userId]: accountData });
    await this.mock.addAccount(userId, accountData);
  }

  async setAccountName(userId: UserId, name: string): Promise<void> {
    await this.mock.setAccountName(userId, name);
  }

  async setAccountEmail(userId: UserId, email: string): Promise<void> {
    await this.mock.setAccountEmail(userId, email);
  }

  async setAccountEmailVerified(userId: UserId, emailVerified: boolean): Promise<void> {
    await this.mock.setAccountEmailVerified(userId, emailVerified);
  }

  async switchAccount(userId: UserId): Promise<void> {
    const next =
      userId == null ? null : { id: userId, ...this.accountsSubject["_buffer"]?.[0]?.[userId] };
    this.activeAccountSubject.next(next);
    await this.mock.switchAccount(userId);
  }

  async clean(userId: UserId): Promise<void> {
    const current = this.accountsSubject["_buffer"][0] ?? {};
    const updated = { ...current, [userId]: loggedOutInfo };
    this.accountsSubject.next(updated);
    await this.mock.clean(userId);
  }
}

const loggedOutInfo: AccountInfo = {
  name: undefined,
  email: "",
  emailVerified: false,
};
