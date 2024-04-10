import { MockProxy, any } from "jest-mock-extended";

import { MigrationHelper } from "../migration-helper";
import { mockMigrationHelper } from "../migration-helper.spec";

import {
  VAULT_TIMEOUT,
  VAULT_TIMEOUT_ACTION,
  VaultTimeoutSettingsServiceStateProviderMigrator,
} from "./55-migrate-vault-timeout-settings-svc-to-state-provider";

// Represents data in state service pre-migration
function preMigrationJson() {
  return {
    global: {
      vaultTimeout: 30,
      vaultTimeoutAction: "lock",
      otherStuff: "otherStuff1",
    },
    authenticatedAccounts: ["user1", "user2", "user3"],
    user1: {
      settings: {
        vaultTimeout: 30,
        vaultTimeoutAction: "lock",
        otherStuff: "otherStuff2",
      },
      otherStuff: "otherStuff3",
    },
    user2: {
      settings: {
        // no vault timeout data to migrate
        otherStuff: "overStuff4",
      },
      otherStuff: "otherStuff5",
    },
  };
}

function rollbackJSON() {
  return {
    // User specific state provider data
    // use pattern user_{userId}_{stateDefinitionName}_{keyDefinitionKey} for user data

    // User1 migrated data
    user_user1_vaultTimeoutSettings_vaultTimeout: 30,
    user_user1_vaultTimeoutSettings_vaultTimeoutAction: "lock",

    // User2 migrated data
    user_user2_vaultTimeoutSettings_vaultTimeou: null as any,
    user_user2_vaultTimeoutSettings_vaultTimeoutAction: null as any,

    // Global state provider data
    // use pattern global_{stateDefinitionName}_{keyDefinitionKey} for global data
    // Not migrating global data

    global: {
      // no longer has vault timeout data
      otherStuff: "otherStuff1",
    },
    authenticatedAccounts: ["user1", "user2", "user3"],
    user1: {
      settings: {
        otherStuff: "otherStuff2",
      },
      otherStuff: "otherStuff3",
    },
    user2: {
      settings: {
        otherStuff: "otherStuff4",
      },
      otherStuff: "otherStuff5",
    },
  };
}

describe("VaultTimeoutSettingsServiceStateProviderMigrator", () => {
  let helper: MockProxy<MigrationHelper>;
  let sut: VaultTimeoutSettingsServiceStateProviderMigrator;

  describe("migrate", () => {
    beforeEach(() => {
      helper = mockMigrationHelper(preMigrationJson(), 55);
      sut = new VaultTimeoutSettingsServiceStateProviderMigrator(55, 56);
    });

    it("should remove state service data from all accounts that have it", async () => {
      await sut.migrate(helper);

      // Global data
      expect(helper.set).toHaveBeenCalledWith("global", {
        // no longer has vault timeout data
        otherStuff: "otherStuff1",
      });

      // User data
      expect(helper.set).toHaveBeenCalledWith("user1", {
        settings: {
          otherStuff: "otherStuff2",
        },
        otherStuff: "otherStuff3",
      });

      expect(helper.set).toHaveBeenCalledTimes(2);
      expect(helper.set).not.toHaveBeenCalledWith("user2", any());
      expect(helper.set).not.toHaveBeenCalledWith("user3", any());
    });

    it("should migrate data to state providers for defined accounts that have the data", async () => {
      await sut.migrate(helper);

      expect(helper.setToUser).toHaveBeenCalledWith("user1", VAULT_TIMEOUT, 30);
      expect(helper.setToUser).toHaveBeenCalledWith("user1", VAULT_TIMEOUT_ACTION, "lock");

      expect(helper.setToUser).not.toHaveBeenCalledWith("user2", VAULT_TIMEOUT, any());
      expect(helper.setToUser).not.toHaveBeenCalledWith("user2", VAULT_TIMEOUT_ACTION, any());

      // Expect that we didn't migrate anything to user 3
      expect(helper.setToUser).not.toHaveBeenCalledWith("user3", VAULT_TIMEOUT, any());
      expect(helper.setToUser).not.toHaveBeenCalledWith("user3", VAULT_TIMEOUT_ACTION, any());
    });
  });

  describe("rollback", () => {
    beforeEach(() => {
      helper = mockMigrationHelper(rollbackJSON(), 56);
      sut = new VaultTimeoutSettingsServiceStateProviderMigrator(55, 56);
    });

    it("should null out newly migrated entries in state provider framework", async () => {
      await sut.rollback(helper);

      expect(helper.setToUser).toHaveBeenCalledWith("user1", VAULT_TIMEOUT, null);
      expect(helper.setToUser).toHaveBeenCalledWith("user1", VAULT_TIMEOUT_ACTION, null);

      expect(helper.setToUser).toHaveBeenCalledWith("user2", VAULT_TIMEOUT, null);
      expect(helper.setToUser).toHaveBeenCalledWith("user2", VAULT_TIMEOUT_ACTION, null);

      expect(helper.setToUser).toHaveBeenCalledWith("user3", VAULT_TIMEOUT, null);
      expect(helper.setToUser).toHaveBeenCalledWith("user3", VAULT_TIMEOUT_ACTION, null);
    });

    it("should add back data to all accounts that had migrated data (only user 1)", async () => {
      await sut.rollback(helper);

      expect(helper.set).toHaveBeenCalledWith("user1", {
        settings: {
          vaultTimeout: 30,
          vaultTimeoutAction: "lock",
          otherStuff: "otherStuff2",
        },
        otherStuff: "otherStuff3",
      });
    });

    it("should not add back the global vault timeout data", async () => {
      await sut.rollback(helper);

      expect(helper.set).not.toHaveBeenCalledWith("global", any());
    });

    it("should not add data back if data wasn't migrated or acct doesn't exist", async () => {
      await sut.rollback(helper);

      // no data to add back for user2 (acct exists but no migrated data) and user3 (no acct)
      expect(helper.set).not.toHaveBeenCalledWith("user2", any());
      expect(helper.set).not.toHaveBeenCalledWith("user3", any());
    });
  });
});
