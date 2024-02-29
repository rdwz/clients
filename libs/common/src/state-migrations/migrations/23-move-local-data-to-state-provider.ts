import { KeyDefinitionLike, MigrationHelper } from "../migration-helper";
import { Migrator } from "../migrator";

type ExpectedAccountType = {
  [cipherId: string]: LocalData;
};

type LocalData = {
  lastUsedDate?: number;
  lastLaunched?: number;
};

const LOCAL_DATA: KeyDefinitionLike = {
  key: "local_data",
  stateDefinition: {
    name: "localData",
  },
};

export class LocalDataMigrator extends Migrator<22, 23> {
  async migrate(helper: MigrationHelper): Promise<void> {
    const accounts = await helper.getAccounts<ExpectedAccountType>();
    async function migrateAccount(userId: string, account: ExpectedAccountType): Promise<void> {
      const value = account?.localData;
      if (value != null) {
        await helper.setToUser(userId, LOCAL_DATA, value);
        delete account.LocalData;
        await helper.set(userId, account);
      }
    }

    await Promise.all([...accounts.map(({ userId, account }) => migrateAccount(userId, account))]);
  }

  async rollback(helper: MigrationHelper): Promise<void> {
    const accounts = await helper.getAccounts<ExpectedAccountType>();
    async function rollbackAccount(userId: string, account: ExpectedAccountType): Promise<void> {
      const value = await helper.getFromUser(userId, LOCAL_DATA);
      if (account) {
        account.localData = Object.assign(account.localData ?? {}, {
          localData: value,
        });
        await helper.set(userId, account);
      }
      await helper.setToUser(userId, LOCAL_DATA, null);
    }

    await Promise.all([...accounts.map(({ userId, account }) => rollbackAccount(userId, account))]);
  }
}
