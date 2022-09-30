import { TokenService as AbstractTokenService } from "@bitwarden/common/abstractions/token.service";
import { TokenService } from "@bitwarden/common/services/token.service";

import { CachedServices, factory, FactoryOptions } from "./factory-options";
import { stateServiceFactory, StateServiceInitOptions } from "./state-service.factory";
import {
  vaultTimeoutSettingsServiceFactory,
  VaultTimeoutSettingsServiceInitOptions,
} from "./vault-timeout-settings-service.factory";

type TokenServiceFactoryOptions = FactoryOptions;

export type TokenServiceInitOptions = TokenServiceFactoryOptions &
  StateServiceInitOptions &
  VaultTimeoutSettingsServiceInitOptions;

export function tokenServiceFactory(
  cache: { tokenService?: AbstractTokenService } & CachedServices,
  opts: TokenServiceInitOptions
): Promise<AbstractTokenService> {
  return factory(
    cache,
    "tokenService",
    opts,
    async () =>
      new TokenService(
        await stateServiceFactory(cache, opts),
        await vaultTimeoutSettingsServiceFactory(cache, opts)
      )
  );
}
