import { ConfigServiceAbstraction } from "@bitwarden/common/platform/abstractions/config/config.service.abstraction";
import { ConfigService } from "@bitwarden/common/platform/services/config/config.service";

import {
  accountServiceFactory,
  AccountServiceInitOptions,
} from "../../../auth/background/service-factories/account-service.factory";

import { configApiServiceFactory, ConfigApiServiceInitOptions } from "./config-api.service.factory";
import {
  environmentServiceFactory,
  EnvironmentServiceInitOptions,
} from "./environment-service.factory";
import { FactoryOptions, CachedServices, factory } from "./factory-options";
import { logServiceFactory, LogServiceInitOptions } from "./log-service.factory";
import { stateServiceFactory, StateServiceInitOptions } from "./state-service.factory";

type ConfigServiceFactoryOptions = FactoryOptions & {
  configServiceOptions?: {
    subscribe?: boolean;
  };
};

export type ConfigServiceInitOptions = ConfigServiceFactoryOptions &
  StateServiceInitOptions &
  ConfigApiServiceInitOptions &
  AccountServiceInitOptions &
  EnvironmentServiceInitOptions &
  LogServiceInitOptions;

export function configServiceFactory(
  cache: { configService?: ConfigServiceAbstraction } & CachedServices,
  opts: ConfigServiceInitOptions,
): Promise<ConfigServiceAbstraction> {
  return factory(
    cache,
    "configService",
    opts,
    async () =>
      new ConfigService(
        await stateServiceFactory(cache, opts),
        await configApiServiceFactory(cache, opts),
        await accountServiceFactory(cache, opts),
        await environmentServiceFactory(cache, opts),
        await logServiceFactory(cache, opts),
        opts.configServiceOptions?.subscribe ?? true,
      ),
  );
}
