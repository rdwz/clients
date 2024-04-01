import { VaultTimeoutAction } from "../../enums/vault-timeout-action.enum";
import { KeyDefinition } from "../../platform/state";

import { VAULT_TIMEOUT_ACTION, EVER_BEEN_UNLOCKED } from "./vault-timeout-settings.state";

describe.each([
  [VAULT_TIMEOUT_ACTION, VaultTimeoutAction.Lock],
  [VAULT_TIMEOUT_ACTION, 5],
  [EVER_BEEN_UNLOCKED, true],
])(
  "deserializes state key definitions",
  (
    keyDefinition:
      | KeyDefinition<VaultTimeoutAction>
      | KeyDefinition<number>
      | KeyDefinition<boolean>,
    state: VaultTimeoutAction | number | boolean,
  ) => {
    function getTypeDescription(value: any): string {
      if (Array.isArray(value)) {
        return "array";
      } else if (value === null) {
        return "null";
      }

      // Fallback for primitive types
      return typeof value;
    }

    function testDeserialization<T>(keyDefinition: KeyDefinition<T>, state: T) {
      const deserialized = keyDefinition.deserializer(JSON.parse(JSON.stringify(state)));
      expect(deserialized).toEqual(state);
    }

    it(`should deserialize state for KeyDefinition<${getTypeDescription(state)}>: "${keyDefinition.key}"`, () => {
      testDeserialization(keyDefinition, state);
    });
  },
);
