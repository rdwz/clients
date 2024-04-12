import { KeyDefinitionLike, MigrationHelper, StateDefinitionLike } from "../migration-helper";
import { Migrator } from "../migrator";

type ExpectedAccountState = {
  settings?: {
    pinKeyEncryptedUserKey?: string; // EncryptedString
    protectedPin?: string;
  };
};

const CRYPTO_STATE: StateDefinitionLike = { name: "crypto" };

const PIN_KEY_ENCRYPTED_USER_KEY: KeyDefinitionLike = {
  stateDefinition: CRYPTO_STATE,
  key: "pinKeyEncryptedUserKey",
};

const PROTECTED_PIN: KeyDefinitionLike = {
  stateDefinition: CRYPTO_STATE,
  key: "protectedPin",
};

export class PinMigrator extends Migrator<55, 56> {
  async migrate(helper: MigrationHelper): Promise<void> {
    const legacyAccounts = await helper.getAccounts<ExpectedAccountState>();

    await Promise.all(
      legacyAccounts.map(async ({ userId, account }) => {
        // Move account pinKeyEncryptedUserKey
        if (account?.settings?.pinKeyEncryptedUserKey != null) {
          await helper.setToUser(
            userId,
            PIN_KEY_ENCRYPTED_USER_KEY,
            account.settings.pinKeyEncryptedUserKey,
          );

          // Delete old account pinKeyEncryptedUserKey property
          delete account?.settings?.pinKeyEncryptedUserKey;
          await helper.set(userId, account);
        }

        // Move account protectedPin
        if (account?.settings?.protectedPin != null) {
          await helper.setToUser(userId, PROTECTED_PIN, account.settings.protectedPin);

          // Delete old account protectedPin property
          delete account?.settings?.protectedPin;
          await helper.set(userId, account);
        }
      }),
    );
  }

  async rollback(helper: MigrationHelper): Promise<void> {
    async function rollbackUser(userId: string, account: ExpectedAccountState) {
      let updatedAccount = false;

      const userPinKeyEncryptedUserKey = await helper.getFromUser<string>(
        userId,
        PIN_KEY_ENCRYPTED_USER_KEY,
      );

      const userProtectedPin = await helper.getFromUser<string>(userId, PROTECTED_PIN);

      if (userPinKeyEncryptedUserKey) {
        if (!account) {
          account = {};
        }

        updatedAccount = true;
        account.settings.pinKeyEncryptedUserKey = userPinKeyEncryptedUserKey;
        await helper.setToUser(userId, PIN_KEY_ENCRYPTED_USER_KEY, null);
      }

      if (userProtectedPin) {
        if (!account) {
          account = {};
        }

        updatedAccount = true;
        account.settings.protectedPin = userProtectedPin;
        await helper.setToUser(userId, PROTECTED_PIN, null);
      }

      if (updatedAccount) {
        await helper.set(userId, account);
      }
    }

    const accounts = await helper.getAccounts<ExpectedAccountState>();

    await Promise.all(accounts.map(({ userId, account }) => rollbackUser(userId, account)));
  }
}
