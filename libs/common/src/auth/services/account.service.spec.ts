import { MockProxy, mock } from "jest-mock-extended";
import { firstValueFrom } from "rxjs";

import { FakeGlobalState } from "../../../spec/fake-state";
import { FakeGlobalStateProvider } from "../../../spec/fake-state-provider";
import { trackEmissions } from "../../../spec/utils";
import { LogService } from "../../platform/abstractions/log.service";
import { MessagingService } from "../../platform/abstractions/messaging.service";
import { UserId } from "../../types/guid";
import { AccountInfo, accountInfoEqual } from "../abstractions/account.service";

import {
  ACCOUNT_ACCOUNTS,
  ACCOUNT_ACTIVE_ACCOUNT_ID,
  AccountServiceImplementation,
} from "./account.service";

describe("accountInfoEqual", () => {
  const accountInfo: AccountInfo = { name: "name", email: "email", emailVerified: true };

  it("compares nulls", () => {
    expect(accountInfoEqual(null, null)).toBe(true);
    expect(accountInfoEqual(null, accountInfo)).toBe(false);
    expect(accountInfoEqual(accountInfo, null)).toBe(false);
  });

  it("compares all keys, not just those defined in AccountInfo", () => {
    const different = { ...accountInfo, extra: "extra" };

    expect(accountInfoEqual(accountInfo, different)).toBe(false);
  });

  it("compares name", () => {
    const same = { ...accountInfo };
    const different = { ...accountInfo, name: "name2" };

    expect(accountInfoEqual(accountInfo, same)).toBe(true);
    expect(accountInfoEqual(accountInfo, different)).toBe(false);
  });

  it("compares email", () => {
    const same = { ...accountInfo };
    const different = { ...accountInfo, email: "email2" };

    expect(accountInfoEqual(accountInfo, same)).toBe(true);
    expect(accountInfoEqual(accountInfo, different)).toBe(false);
  });

  it("compares emailVerified", () => {
    const same = { ...accountInfo };
    const different = { ...accountInfo, emailVerified: false };

    expect(accountInfoEqual(accountInfo, same)).toBe(true);
    expect(accountInfoEqual(accountInfo, different)).toBe(false);
  });
});

describe("accountService", () => {
  let messagingService: MockProxy<MessagingService>;
  let logService: MockProxy<LogService>;
  let globalStateProvider: FakeGlobalStateProvider;
  let sut: AccountServiceImplementation;
  let accountsState: FakeGlobalState<Record<UserId, AccountInfo>>;
  let activeAccountIdState: FakeGlobalState<UserId>;
  const userId = "userId" as UserId;
  const userInfo = { email: "email", name: "name", emailVerified: true };

  beforeEach(() => {
    messagingService = mock();
    logService = mock();
    globalStateProvider = new FakeGlobalStateProvider();

    sut = new AccountServiceImplementation(messagingService, logService, globalStateProvider);

    accountsState = globalStateProvider.getFake(ACCOUNT_ACCOUNTS);
    activeAccountIdState = globalStateProvider.getFake(ACCOUNT_ACTIVE_ACCOUNT_ID);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("activeAccount$", () => {
    it("should emit undefined if no account is active", () => {
      const emissions = trackEmissions(sut.activeAccount$);

      expect(emissions).toEqual([undefined]);
    });

    it("should emit the active account", async () => {
      const emissions = trackEmissions(sut.activeAccount$);
      accountsState.stateSubject.next({ [userId]: userInfo });
      activeAccountIdState.stateSubject.next(userId);

      expect(emissions).toEqual([
        undefined, // initial value
        { id: userId, ...userInfo },
      ]);
    });

    it("should remember the last emitted value", async () => {
      accountsState.stateSubject.next({ [userId]: userInfo });
      activeAccountIdState.stateSubject.next(userId);

      expect(await firstValueFrom(sut.activeAccount$)).toEqual({
        id: userId,
        ...userInfo,
      });
    });
  });

  describe("accounts$", () => {
    it("should maintain an accounts cache", async () => {
      accountsState.stateSubject.next({ [userId]: userInfo });
      accountsState.stateSubject.next({ [userId]: userInfo });
      expect(await firstValueFrom(sut.accounts$)).toEqual({
        [userId]: userInfo,
      });
    });
  });

  describe("addAccount", () => {
    it("should emit the new account", async () => {
      await sut.addAccount(userId, userInfo);
      const currentValue = await firstValueFrom(sut.accounts$);

      expect(currentValue).toEqual({ [userId]: userInfo });
    });
  });

  describe("setAccountName", () => {
    const initialState = { [userId]: userInfo };
    beforeEach(() => {
      accountsState.stateSubject.next(initialState);
    });

    it("should update the account", async () => {
      await sut.setAccountName(userId, "new name");
      const currentState = await firstValueFrom(accountsState.state$);

      expect(currentState).toEqual({
        [userId]: { ...userInfo, name: "new name" },
      });
    });

    it("should not update if the name is the same", async () => {
      await sut.setAccountName(userId, "name");
      const currentState = await firstValueFrom(accountsState.state$);

      expect(currentState).toEqual(initialState);
    });
  });

  describe("setAccountEmail", () => {
    const initialState = { [userId]: userInfo };
    beforeEach(() => {
      accountsState.stateSubject.next(initialState);
    });

    it("should update the account", async () => {
      await sut.setAccountEmail(userId, "new email");
      const currentState = await firstValueFrom(accountsState.state$);

      expect(currentState).toEqual({
        [userId]: { ...userInfo, email: "new email" },
      });
    });

    it("should not update if the email is the same", async () => {
      await sut.setAccountEmail(userId, "email");
      const currentState = await firstValueFrom(accountsState.state$);

      expect(currentState).toEqual(initialState);
    });
  });

  describe("setAccountEmailVerified", () => {
    const initialState = { [userId]: userInfo };
    initialState[userId].emailVerified = false;
    beforeEach(() => {
      accountsState.stateSubject.next(initialState);
    });

    it("should update the account", async () => {
      await sut.setAccountEmailVerified(userId, true);
      const currentState = await firstValueFrom(accountsState.state$);

      expect(currentState).toEqual({
        [userId]: { ...userInfo, emailVerified: true },
      });
    });

    it("should not update if the email is the same", async () => {
      await sut.setAccountEmailVerified(userId, false);
      const currentState = await firstValueFrom(accountsState.state$);

      expect(currentState).toEqual(initialState);
    });
  });

  describe("clean", () => {
    beforeEach(() => {
      accountsState.stateSubject.next({ [userId]: userInfo });
    });

    it("removes account info of the given user", async () => {
      await sut.clean(userId);
      const currentState = await firstValueFrom(accountsState.state$);

      expect(currentState).toEqual({
        [userId]: {
          email: "",
          emailVerified: false,
          name: undefined,
        },
      });
    });
  });

  describe("switchAccount", () => {
    beforeEach(() => {
      accountsState.stateSubject.next({ [userId]: userInfo });
      activeAccountIdState.stateSubject.next(userId);
    });

    it("should emit undefined if no account is provided", async () => {
      await sut.switchAccount(null);
      const currentState = await firstValueFrom(sut.activeAccount$);
      expect(currentState).toBeUndefined();
    });

    it("should throw if the account does not exist", () => {
      // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      expect(sut.switchAccount("unknown" as UserId)).rejects.toThrowError("Account does not exist");
    });
  });
});
