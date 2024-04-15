import { KeyDefinitionLike, MigrationHelper } from "../migration-helper";
import { Migrator } from "../migrator";

type ExpectedAccountType = NonNullable<unknown>;

export const REFRESH_TOKEN_MIGRATED_TO_SECURE_STORAGE: KeyDefinitionLike = {
  key: "refreshTokenMigratedToSecureStorage", // matches KeyDefinition.key in DeviceTrustCryptoService
  stateDefinition: {
    name: "token", // matches StateDefinition.name in StateDefinitions
  },
};

export class RemoveRefreshTokenMigratedFlagMigrator extends Migrator<56, 57> {
  async migrate(helper: MigrationHelper): Promise<void> {
    const accounts = await helper.getAccounts<ExpectedAccountType>();
    async function migrateAccount(userId: string, account: ExpectedAccountType): Promise<void> {
      const refreshTokenMigratedFlag = await helper.getFromUser(
        userId,
        REFRESH_TOKEN_MIGRATED_TO_SECURE_STORAGE,
      );

      if (refreshTokenMigratedFlag != null) {
        // Only delete the flag if it exists
        await helper.removeFromUser(userId, REFRESH_TOKEN_MIGRATED_TO_SECURE_STORAGE);
      }
    }

    await Promise.all([...accounts.map(({ userId, account }) => migrateAccount(userId, account))]);
  }

  async rollback(helper: MigrationHelper): Promise<void> {
    const accounts = await helper.getAccounts<ExpectedAccountType>();
    async function rollbackAccount(userId: string, account: ExpectedAccountType): Promise<void> {
      // No rollback needed
    }

    await Promise.all([...accounts.map(({ userId, account }) => rollbackAccount(userId, account))]);
  }
}
