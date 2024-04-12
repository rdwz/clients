import { mock, MockProxy } from "jest-mock-extended";
import { BehaviorSubject, firstValueFrom, map, of } from "rxjs";

import {
  FakeUserDecryptionOptions as UserDecryptionOptions,
  UserDecryptionOptionsServiceAbstraction,
} from "@bitwarden/auth/common";

import { Utils } from "../..//platform/misc/utils";
import { FakeAccountService, mockAccountServiceWith, FakeStateProvider } from "../../../spec";
import { VaultTimeoutSettingsService as VaultTimeoutSettingsServiceAbstraction } from "../../abstractions/vault-timeout/vault-timeout-settings.service";
import { PolicyService } from "../../admin-console/abstractions/policy/policy.service.abstraction";
import { Policy } from "../../admin-console/models/domain/policy";
import { TokenService } from "../../auth/abstractions/token.service";
import { VaultTimeoutAction } from "../../enums/vault-timeout-action.enum";
import { CryptoService } from "../../platform/abstractions/crypto.service";
import { LogService } from "../../platform/abstractions/log.service";
import { StateService } from "../../platform/abstractions/state.service";
import { BiometricStateService } from "../../platform/biometrics/biometric-state.service";
import { EncString } from "../../platform/models/domain/enc-string";
import {
  VAULT_TIMEOUT,
  VAULT_TIMEOUT_ACTION,
} from "../../services/vault-timeout/vault-timeout-settings.state";
import { UserId } from "../../types/guid";

import { VaultTimeoutSettingsService } from "./vault-timeout-settings.service";

describe("VaultTimeoutSettingsService", () => {
  let userDecryptionOptionsService: MockProxy<UserDecryptionOptionsServiceAbstraction>;
  let cryptoService: MockProxy<CryptoService>;
  let tokenService: MockProxy<TokenService>;
  let policyService: MockProxy<PolicyService>;
  let stateService: MockProxy<StateService>;
  const biometricStateService = mock<BiometricStateService>();
  let vaultTimeoutSettingsService: VaultTimeoutSettingsServiceAbstraction;

  let userDecryptionOptionsSubject: BehaviorSubject<UserDecryptionOptions>;

  const mockUserId = Utils.newGuid() as UserId;
  let accountService: FakeAccountService;
  let stateProvider: FakeStateProvider;

  let logService: MockProxy<LogService>;

  beforeEach(() => {
    userDecryptionOptionsService = mock<UserDecryptionOptionsServiceAbstraction>();
    cryptoService = mock<CryptoService>();
    tokenService = mock<TokenService>();
    policyService = mock<PolicyService>();
    stateService = mock<StateService>();

    userDecryptionOptionsSubject = new BehaviorSubject(null);
    userDecryptionOptionsService.userDecryptionOptions$ = userDecryptionOptionsSubject;
    userDecryptionOptionsService.hasMasterPassword$ = userDecryptionOptionsSubject.pipe(
      map((options) => options?.hasMasterPassword ?? false),
    );
    userDecryptionOptionsService.userDecryptionOptionsById$.mockReturnValue(
      userDecryptionOptionsSubject,
    );

    accountService = mockAccountServiceWith(mockUserId);
    stateProvider = new FakeStateProvider(accountService);

    logService = mock<LogService>();

    vaultTimeoutSettingsService = new VaultTimeoutSettingsService(
      userDecryptionOptionsService,
      cryptoService,
      tokenService,
      policyService,
      stateService,
      biometricStateService,
      stateProvider,
      logService,
    );

    biometricStateService.biometricUnlockEnabled$ = of(false);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("availableVaultTimeoutActions$", () => {
    it("always returns LogOut", async () => {
      const result = await firstValueFrom(
        vaultTimeoutSettingsService.availableVaultTimeoutActions$(),
      );

      expect(result).toContain(VaultTimeoutAction.LogOut);
    });

    it("contains Lock when the user has a master password", async () => {
      userDecryptionOptionsSubject.next(new UserDecryptionOptions({ hasMasterPassword: true }));

      const result = await firstValueFrom(
        vaultTimeoutSettingsService.availableVaultTimeoutActions$(),
      );

      expect(result).toContain(VaultTimeoutAction.Lock);
    });

    it("contains Lock when the user has a persistent PIN configured", async () => {
      stateService.getPinKeyEncryptedUserKey.mockResolvedValue(createEncString());

      const result = await firstValueFrom(
        vaultTimeoutSettingsService.availableVaultTimeoutActions$(),
      );

      expect(result).toContain(VaultTimeoutAction.Lock);
    });

    it("contains Lock when the user has a transient/ephemeral PIN configured", async () => {
      stateService.getProtectedPin.mockResolvedValue("some-key");

      const result = await firstValueFrom(
        vaultTimeoutSettingsService.availableVaultTimeoutActions$(),
      );

      expect(result).toContain(VaultTimeoutAction.Lock);
    });

    it("contains Lock when the user has biometrics configured", async () => {
      biometricStateService.biometricUnlockEnabled$ = of(true);

      const result = await firstValueFrom(
        vaultTimeoutSettingsService.availableVaultTimeoutActions$(),
      );

      expect(result).toContain(VaultTimeoutAction.Lock);
    });

    it("not contains Lock when the user does not have a master password, PIN, or biometrics", async () => {
      userDecryptionOptionsSubject.next(new UserDecryptionOptions({ hasMasterPassword: false }));
      stateService.getPinKeyEncryptedUserKey.mockResolvedValue(null);
      stateService.getProtectedPin.mockResolvedValue(null);
      biometricStateService.biometricUnlockEnabled$ = of(false);

      const result = await firstValueFrom(
        vaultTimeoutSettingsService.availableVaultTimeoutActions$(),
      );

      expect(result).not.toContain(VaultTimeoutAction.Lock);
    });
  });

  describe("getVaultTimeoutActionByUserId$", () => {
    describe("given the user has a master password", () => {
      it.each`
        policy                       | userPreference               | expected
        ${null}                      | ${null}                      | ${VaultTimeoutAction.Lock}
        ${null}                      | ${VaultTimeoutAction.LogOut} | ${VaultTimeoutAction.LogOut}
        ${VaultTimeoutAction.LogOut} | ${null}                      | ${VaultTimeoutAction.LogOut}
        ${VaultTimeoutAction.LogOut} | ${VaultTimeoutAction.Lock}   | ${VaultTimeoutAction.LogOut}
      `(
        "returns $expected when policy is $policy, and user preference is $userPreference",
        async ({ policy, userPreference, expected }) => {
          userDecryptionOptionsSubject.next(new UserDecryptionOptions({ hasMasterPassword: true }));
          policyService.getAll$.mockReturnValue(
            of(policy === null ? [] : ([{ data: { action: policy } }] as unknown as Policy[])),
          );

          await stateProvider.setUserState(VAULT_TIMEOUT_ACTION, userPreference, mockUserId);

          const result = await firstValueFrom(
            vaultTimeoutSettingsService.getVaultTimeoutActionByUserId$(mockUserId),
          );

          expect(result).toBe(expected);
        },
      );
    });

    describe("given the user does not have a master password", () => {
      it.each`
        hasPinUnlock | hasBiometricUnlock | policy                     | userPreference               | expected
        ${false}     | ${false}           | ${null}                    | ${null}                      | ${VaultTimeoutAction.LogOut}
        ${false}     | ${false}           | ${null}                    | ${VaultTimeoutAction.Lock}   | ${VaultTimeoutAction.LogOut}
        ${false}     | ${false}           | ${VaultTimeoutAction.Lock} | ${null}                      | ${VaultTimeoutAction.LogOut}
        ${false}     | ${true}            | ${null}                    | ${null}                      | ${VaultTimeoutAction.LogOut}
        ${false}     | ${true}            | ${null}                    | ${VaultTimeoutAction.Lock}   | ${VaultTimeoutAction.Lock}
        ${false}     | ${true}            | ${VaultTimeoutAction.Lock} | ${null}                      | ${VaultTimeoutAction.Lock}
        ${false}     | ${true}            | ${VaultTimeoutAction.Lock} | ${VaultTimeoutAction.LogOut} | ${VaultTimeoutAction.Lock}
        ${true}      | ${false}           | ${null}                    | ${null}                      | ${VaultTimeoutAction.LogOut}
        ${true}      | ${false}           | ${null}                    | ${VaultTimeoutAction.Lock}   | ${VaultTimeoutAction.Lock}
        ${true}      | ${false}           | ${VaultTimeoutAction.Lock} | ${null}                      | ${VaultTimeoutAction.Lock}
        ${true}      | ${false}           | ${VaultTimeoutAction.Lock} | ${VaultTimeoutAction.LogOut} | ${VaultTimeoutAction.Lock}
      `(
        "returns $expected when policy is $policy, has PIN unlock method: $hasPinUnlock or Biometric unlock method: $hasBiometricUnlock, and user preference is $userPreference",
        async ({ hasPinUnlock, hasBiometricUnlock, policy, userPreference, expected }) => {
          biometricStateService.getBiometricUnlockEnabled.mockResolvedValue(hasBiometricUnlock);

          if (hasPinUnlock) {
            stateService.getProtectedPin.mockResolvedValue("PIN");
            stateService.getPinKeyEncryptedUserKey.mockResolvedValue(new EncString("PIN"));
          }

          userDecryptionOptionsSubject.next(
            new UserDecryptionOptions({ hasMasterPassword: false }),
          );
          policyService.getAll$.mockReturnValue(
            of(policy === null ? [] : ([{ data: { action: policy } }] as unknown as Policy[])),
          );

          await stateProvider.setUserState(VAULT_TIMEOUT_ACTION, userPreference, mockUserId);

          const result = await firstValueFrom(
            vaultTimeoutSettingsService.getVaultTimeoutActionByUserId$(mockUserId),
          );

          expect(result).toBe(expected);
        },
      );
    });
  });

  describe("getVaultTimeoutByUserId$", () => {
    it.each([
      // policy, vaultTimeout, expected
      [null, null, null],
      [30, 90, 30], // policy overrides vault timeout
      [30, 15, 15], // policy doesn't override vault timeout when it's within acceptable range
    ])(
      "when policy is %s, and vault timeout is %s, returns %s",
      async (policy, vaultTimeout, expected) => {
        userDecryptionOptionsSubject.next(new UserDecryptionOptions({ hasMasterPassword: true }));
        policyService.getAll$.mockReturnValue(
          of(policy === null ? [] : ([{ data: { minutes: policy } }] as unknown as Policy[])),
        );

        await stateProvider.setUserState(VAULT_TIMEOUT, vaultTimeout, mockUserId);

        const result = await firstValueFrom(
          vaultTimeoutSettingsService.getVaultTimeoutByUserId$(mockUserId),
        );

        expect(result).toBe(expected);
      },
    );
  });
});

function createEncString() {
  return Symbol() as unknown as EncString;
}
