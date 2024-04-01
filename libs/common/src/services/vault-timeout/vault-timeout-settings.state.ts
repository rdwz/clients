import { VaultTimeoutAction } from "../../enums/vault-timeout-action.enum";
import {
  KeyDefinition,
  VAULT_TIMEOUT_SETTINGS_DISK_LOCAL,
  VAULT_TIMEOUT_SETTINGS_MEMORY,
} from "../../platform/state";

/**
 * Settings use disk storage and local storage on web so settings can persist after logout.
 */
export const VAULT_TIMEOUT_ACTION = new KeyDefinition<VaultTimeoutAction>(
  VAULT_TIMEOUT_SETTINGS_DISK_LOCAL,
  "vaultTimeoutAction",
  {
    deserializer: (vaultTimeoutAction) => vaultTimeoutAction,
  },
);

export const VAULT_TIMEOUT = new KeyDefinition<number>(
  VAULT_TIMEOUT_SETTINGS_DISK_LOCAL,
  "vaultTimeout",
  {
    deserializer: (vaultTimeout) => vaultTimeout,
  },
);

export const EVER_BEEN_UNLOCKED = new KeyDefinition<boolean>(
  VAULT_TIMEOUT_SETTINGS_MEMORY,
  "everBeenUnlocked",
  {
    deserializer: (everBeenUnlocked) => everBeenUnlocked,
  },
);
