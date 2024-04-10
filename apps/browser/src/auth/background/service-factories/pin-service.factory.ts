import { PinServiceAbstraction, PinService } from "@bitwarden/auth/common";

import {
  VaultTimeoutSettingsServiceInitOptions,
  vaultTimeoutSettingsServiceFactory,
} from "../../../background/service-factories/vault-timeout-settings-service.factory";
import {
  EncryptServiceInitOptions,
  encryptServiceFactory,
} from "../../../platform/background/service-factories/encrypt-service.factory";
import {
  FactoryOptions,
  CachedServices,
  factory,
} from "../../../platform/background/service-factories/factory-options";
import {
  KeyGenerationServiceInitOptions,
  keyGenerationServiceFactory,
} from "../../../platform/background/service-factories/key-generation-service.factory";
import {
  LogServiceInitOptions,
  logServiceFactory,
} from "../../../platform/background/service-factories/log-service.factory";
import {
  StateProviderInitOptions,
  stateProviderFactory,
} from "../../../platform/background/service-factories/state-provider.factory";
import {
  StateServiceInitOptions,
  stateServiceFactory,
} from "../../../platform/background/service-factories/state-service.factory";

import {
  MasterPasswordServiceInitOptions,
  internalMasterPasswordServiceFactory,
} from "./master-password-service.factory";

type PinServiceFactoryOptions = FactoryOptions;

export type PinServiceInitOptions = PinServiceFactoryOptions &
  StateProviderInitOptions &
  StateServiceInitOptions &
  MasterPasswordServiceInitOptions &
  KeyGenerationServiceInitOptions &
  EncryptServiceInitOptions &
  VaultTimeoutSettingsServiceInitOptions &
  LogServiceInitOptions;

export function pinServiceFactory(
  cache: { pinService?: PinServiceAbstraction } & CachedServices,
  opts: PinServiceInitOptions,
): Promise<PinServiceAbstraction> {
  return factory(
    cache,
    "pinService",
    opts,
    async () =>
      new PinService(
        await stateProviderFactory(cache, opts),
        await stateServiceFactory(cache, opts),
        await internalMasterPasswordServiceFactory(cache, opts),
        await keyGenerationServiceFactory(cache, opts),
        await encryptServiceFactory(cache, opts),
        await vaultTimeoutSettingsServiceFactory(cache, opts),
        await logServiceFactory(cache, opts),
      ),
  );
}
