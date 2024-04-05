import { MockProxy } from "jest-mock-extended";

import { KeyDefinitionLike, MigrationHelper } from "../migration-helper";
import { mockMigrationHelper } from "../migration-helper.spec";

import { KeyConnectorMigrator } from "./43-move-key-connector-to-state-provider";

function exampleJSON() {
  return {
    profile: {
      usesKeyConnector: true,
      convertAccountToKeyConnector: true,
      otherProfileStuff: "profile.otherStuff1",
    },
  };
}

function rollbackJSON() {
  return {
    global_keyConnector_usesKeyConnector: false,
    global_keyConnector_convertAccountToKeyConnector: false,
    global: {
      otherGlobalStuff: "global.otherStuff1",
    },
    profile: {
      otherProfileStuff: "profile.otherStuff1",
    },
    otherStuff: "otherStuff2",
  };
}

const usesKeyConnectorKeyDefinition: KeyDefinitionLike = {
  key: "usesKeyConnector",
  stateDefinition: {
    name: "keyConnector",
  },
};

describe("KeyConnectorMigrator", () => {
  let helper: MockProxy<MigrationHelper>;
  let sut: KeyConnectorMigrator;

  describe("migrate", () => {
    beforeEach(() => {
      helper = mockMigrationHelper(exampleJSON(), 42);
      sut = new KeyConnectorMigrator(42, 43);
    });

    it("should remove usesKeyConnector and convertAccountToKeyConnector from Profile", async () => {
      await sut.migrate(helper);

      expect(helper.set).toHaveBeenCalledTimes(2);
      expect(helper.set).toHaveBeenCalledWith("profile", {
        otherProfileStuff: "profile.otherStuff1",
      });
    });

    it("should set usesKeyConnector globally", async () => {
      await sut.migrate(helper);

      expect(helper.setToGlobal).toHaveBeenCalledTimes(2);
      expect(helper.setToGlobal).toHaveBeenCalledWith(usesKeyConnectorKeyDefinition, true);
    });

    it("should set convertAccountToKeyConnector globally", async () => {
      await sut.migrate(helper);

      expect(helper.setToGlobal).toHaveBeenCalledTimes(2);
      expect(helper.setToGlobal).toHaveBeenCalledWith(
        convertAccountToKeyConnectorKeyDefinition,
        true,
      );
    });
  });

  describe("rollback", () => {
    beforeEach(() => {
      helper = mockMigrationHelper(rollbackJSON(), 42);
      sut = new KeyConnectorMigrator(42, 43);
    });

    it("should null out new usesKeyConnector global value", async () => {
      await sut.rollback(helper);

      expect(helper.setToGlobal).toHaveBeenCalledTimes(2);
      expect(helper.setToGlobal).toHaveBeenCalledWith(usesKeyConnectorKeyDefinition, null);
      expect(helper.setToGlobal).toHaveBeenCalledWith(
        convertAccountToKeyConnectorKeyDefinition,
        null,
      );
    });

    it("should add usesKeyConnector profile value to profile", async () => {
      await sut.rollback(helper);

      expect(helper.set).toHaveBeenCalledTimes(2);
      expect(helper.set).toHaveBeenCalledWith("profile", {
        usesKeyConnector: false,
        otherProfileStuff: "profile.otherStuff1",
      });
    });

    it("should add convertAccountToKeyConnector profile value to profile", async () => {
      await sut.rollback(helper);

      expect(helper.set).toHaveBeenCalledTimes(2);
      expect(helper.set).toHaveBeenCalledWith("profile", {
        convertAccountToKeyConnector: false,
        otherProfileStuff: "profile.otherStuff1",
      });
    });
  });
});
