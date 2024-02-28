import { mock } from "jest-mock-extended";

import { FakeAccountService, FakeStateProvider, mockAccountServiceWith } from "../../../spec";
import { ApiService } from "../../abstractions/api.service";
import { OrganizationService } from "../../admin-console/abstractions/organization/organization.service.abstraction";
import { OrganizationData } from "../../admin-console/models/data/organization.data";
import { Organization } from "../../admin-console/models/domain/organization";
import { ProfileOrganizationResponse } from "../../admin-console/models/response/profile-organization.response";
import { CryptoService } from "../../platform/abstractions/crypto.service";
import { LogService } from "../../platform/abstractions/log.service";
import { Utils } from "../../platform/misc/utils";
import { KeyGenerationService } from "../../platform/services/key-generation.service";
import { OrganizationId, UserId } from "../../types/guid";

import {
  USES_KEY_CONNECTOR,
  CONVERT_ACCOUNT_TO_KEY_CONNECTOR,
  KeyConnectorService,
} from "./key-connector.service";
import { TokenService } from "./token.service";

describe("KeyConnectorService", () => {
  let keyConnectorService: KeyConnectorService;

  const cryptoService = mock<CryptoService>();
  const apiService = mock<ApiService>();
  const tokenService = mock<TokenService>();
  const logService = mock<LogService>();
  const organizationService = mock<OrganizationService>();
  const keyGenerationService = mock<KeyGenerationService>();

  let stateProvider: FakeStateProvider;

  let accountService: FakeAccountService;

  const mockUserId = Utils.newGuid() as UserId;
  const mockOrgId = Utils.newGuid() as OrganizationId;

  beforeEach(() => {
    jest.clearAllMocks();

    accountService = mockAccountServiceWith(mockUserId);
    stateProvider = new FakeStateProvider(accountService);

    keyConnectorService = new KeyConnectorService(
      cryptoService,
      apiService,
      tokenService,
      logService,
      organizationService,
      keyGenerationService,
      async () => {},
      stateProvider,
    );
  });

  it("instantiates", () => {
    expect(keyConnectorService).not.toBeFalsy();
  });

  describe("setUsesKeyConnector()", () => {
    it("should update the usesKeyConnectorState with the provided value", async () => {
      const state = stateProvider.activeUser.getFake(USES_KEY_CONNECTOR);
      state.nextState(false);

      const newValue = true;

      await keyConnectorService.setUsesKeyConnector(newValue);

      expect(await keyConnectorService.getUsesKeyConnector()).toBe(newValue);
    });
  });

  describe("getManagingOrganization()", () => {
    it("should return the managing organization with key connector enabled", async () => {
      // Arrange
      const orgs = [
        organizationData(true, true, "https://key-connector-url.com", 2, false),
        organizationData(false, true, "https://key-connector-url.com", 2, false),
        organizationData(true, false, "https://key-connector-url.com", 2, false),
        organizationData(true, true, "https://other-url.com", 2, false),
      ];
      organizationService.getAll.mockResolvedValue(orgs);

      // Act
      const result = await keyConnectorService.getManagingOrganization();

      // Assert
      expect(result).toEqual(orgs[0]);
    });

    it("should return undefined if no managing organization with key connector enabled is found", async () => {
      // Arrange
      const orgs = [
        organizationData(true, false, "https://key-connector-url.com", 2, false),
        organizationData(false, false, "https://key-connector-url.com", 2, false),
      ];
      organizationService.getAll.mockResolvedValue(orgs);

      // Act
      const result = await keyConnectorService.getManagingOrganization();

      // Assert
      expect(result).toBeUndefined();
    });

    it("should return undefined if user is Owner or Admin", async () => {
      // Arrange
      const orgs = [
        organizationData(true, true, "https://key-connector-url.com", 0, false),
        organizationData(true, true, "https://key-connector-url.com", 1, false),
      ];
      organizationService.getAll.mockResolvedValue(orgs);

      // Act
      const result = await keyConnectorService.getManagingOrganization();

      // Assert
      expect(result).toBeUndefined();
    });

    it("should return undefined if user is a Provider", async () => {
      // Arrange
      const orgs = [
        organizationData(true, true, "https://key-connector-url.com", 2, true),
        organizationData(false, true, "https://key-connector-url.com", 2, true),
      ];
      organizationService.getAll.mockResolvedValue(orgs);

      // Act
      const result = await keyConnectorService.getManagingOrganization();

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe("setConvertAccountRequired()", () => {
    it("should update the convertAccountToKeyConnectorState with the provided value", async () => {
      const state = stateProvider.activeUser.getFake(CONVERT_ACCOUNT_TO_KEY_CONNECTOR);
      state.nextState(false);

      const newValue = true;

      await keyConnectorService.setConvertAccountRequired(newValue);

      expect(await keyConnectorService.getConvertAccountRequired()).toBe(newValue);
    });

    it("should remove the convertAccountToKeyConnectorState", async () => {
      const state = stateProvider.activeUser.getFake(CONVERT_ACCOUNT_TO_KEY_CONNECTOR);
      state.nextState(false);

      const newValue: boolean = null;

      await keyConnectorService.setConvertAccountRequired(newValue);

      expect(await keyConnectorService.getConvertAccountRequired()).toBe(newValue);
    });
  });

  describe("clear()", () => {
    it("should clear the user state for CONVERT_ACCOUNT_TO_KEY_CONNECTOR", async () => {
      // Arrange
      const setUserStateSpy = jest.spyOn(stateProvider, "setUserState");

      // Act
      await keyConnectorService.clear(mockUserId);

      // Assert
      expect(setUserStateSpy).toHaveBeenCalledWith(
        CONVERT_ACCOUNT_TO_KEY_CONNECTOR,
        null,
        mockUserId,
      );
      expect(await keyConnectorService.getConvertAccountRequired()).toBe(null);
    });
  });

  describe("userNeedsMigration()", () => {
    it("should return true if the user needs migration", async () => {
      // token
      tokenService.getIsExternal.mockResolvedValue(true);

      // create organization object
      const data = organizationData(true, true, "https://key-connector-url.com", 2, false);
      organizationService.getAll.mockResolvedValue([data]);

      // uses KeyConnector
      const state = stateProvider.activeUser.getFake(USES_KEY_CONNECTOR);
      state.nextState(false);

      const result = await keyConnectorService.userNeedsMigration();

      expect(result).toBe(true);
    });

    it("should return false if the user does not need migration", async () => {
      tokenService.getIsExternal.mockResolvedValue(false);
      const data = organizationData(false, false, "https://key-connector-url.com", 2, false);
      organizationService.getAll.mockResolvedValue([data]);

      const state = stateProvider.activeUser.getFake(USES_KEY_CONNECTOR);
      state.nextState(true);
      const result = await keyConnectorService.userNeedsMigration();

      expect(result).toBe(false);
    });
  });

  function organizationData(
    usesKeyConnector: boolean,
    keyConnectorEnabled: boolean,
    keyConnectorUrl: string,
    userType: number,
    isProviderUser: boolean,
  ): Organization {
    return new Organization(
      new OrganizationData(
        new ProfileOrganizationResponse({
          id: mockOrgId,
          name: "TEST_KEY_CONNECTOR_ORG",
          usePolicies: true,
          useSso: true,
          useKeyConnector: usesKeyConnector,
          useScim: true,
          useGroups: true,
          useDirectory: true,
          useEvents: true,
          useTotp: true,
          use2fa: true,
          useApi: true,
          useResetPassword: true,
          useSecretsManager: true,
          usePasswordManager: true,
          usersGetPremium: true,
          useCustomPermissions: true,
          useActivateAutofillPolicy: true,
          selfHost: true,
          seats: 5,
          maxCollections: null,
          maxStorageGb: 1,
          key: "super-secret-key",
          status: 2,
          type: userType,
          enabled: true,
          ssoBound: true,
          identifier: "TEST_KEY_CONNECTOR_ORG",
          permissions: {
            accessEventLogs: false,
            accessImportExport: false,
            accessReports: false,
            createNewCollections: false,
            editAnyCollection: false,
            deleteAnyCollection: false,
            editAssignedCollections: false,
            deleteAssignedCollections: false,
            manageGroups: false,
            managePolicies: false,
            manageSso: false,
            manageUsers: false,
            manageResetPassword: false,
            manageScim: false,
          },
          resetPasswordEnrolled: true,
          userId: mockUserId,
          hasPublicAndPrivateKeys: true,
          providerId: null,
          providerName: null,
          providerType: null,
          familySponsorshipFriendlyName: null,
          familySponsorshipAvailable: true,
          planProductType: 3,
          KeyConnectorEnabled: keyConnectorEnabled,
          KeyConnectorUrl: keyConnectorUrl,
          familySponsorshipLastSyncDate: null,
          familySponsorshipValidUntil: null,
          familySponsorshipToDelete: null,
          accessSecretsManager: false,
          limitCollectionCreationDeletion: true,
          allowAdminAccessToAllCollectionItems: true,
          flexibleCollections: false,
          object: "profileOrganization",
        }),
        { isMember: true, isProviderUser: isProviderUser },
      ),
    );
  }
});
