import { KeyDefinitionLike, MigrationHelper } from "../migration-helper";
import { Migrator } from "../migrator";

type ExpectedAccountState = {
  usesKeyConnector?: boolean;
  convertAccountToKeyConnector?: boolean;
};

const usesKeyConnectorKeyDefinition: KeyDefinitionLike = {
  key: "usesKeyConnector",
  stateDefinition: {
    name: "keyConnector",
  },
};

const convertAccountToKeyConnectorKeyDefinition: KeyDefinitionLike = {
  key: "convertAccountToKeyConnector",
  stateDefinition: {
    name: "keyConnector",
  },
};

export class KeyConnectorMigrator extends Migrator<34, 35> {
  async migrate(helper: MigrationHelper): Promise<void> {
    const profileState = await helper.get<ExpectedAccountState>("profile");

    // profile.usesKeyConnector -> usesKeyConnector
    if (profileState?.usesKeyConnector != null) {
      await helper.setToGlobal(usesKeyConnectorKeyDefinition, profileState.usesKeyConnector);

      delete profileState.usesKeyConnector;

      await helper.set<ExpectedAccountState>("profile", profileState);
    }

    // profile.convertAccountToKeyConnector -> convertAccountToKeyConnector
    if (profileState?.convertAccountToKeyConnector != null) {
      await helper.setToGlobal(
        convertAccountToKeyConnectorKeyDefinition,
        profileState.convertAccountToKeyConnector,
      );

      delete profileState.convertAccountToKeyConnector;

      await helper.set<ExpectedAccountState>("profile", profileState);
    }
  }

  async rollback(helper: MigrationHelper): Promise<void> {
    const globalState = (await helper.get<ExpectedAccountState>("profile")) || {};

    const usesKeyConnector: boolean = await helper.getFromGlobal(usesKeyConnectorKeyDefinition);

    // usesKeyConnector -> profile.usesKeyConnector
    if (usesKeyConnector != null) {
      await helper.set<ExpectedAccountState>("profile", {
        ...globalState,
        usesKeyConnector: usesKeyConnector,
      });

      await helper.setToGlobal(usesKeyConnectorKeyDefinition, null);
    }

    const convertAccountToKeyConnector: boolean = await helper.getFromGlobal(
      convertAccountToKeyConnectorKeyDefinition,
    );

    // usesKeyConnector -> profile.convertAccountToKeyConnector
    if (convertAccountToKeyConnector != null) {
      await helper.set<ExpectedAccountState>("profile", {
        ...globalState,
        convertAccountToKeyConnector: convertAccountToKeyConnector,
      });

      await helper.setToGlobal(convertAccountToKeyConnectorKeyDefinition, null);
    }
  }
}
