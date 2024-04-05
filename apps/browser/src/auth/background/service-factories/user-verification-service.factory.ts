import { UserVerificationService as AbstractUserVerificationService } from "@bitwarden/common/auth/abstractions/user-verification/user-verification.service.abstraction";
import { UserVerificationService } from "@bitwarden/common/auth/services/user-verification/user-verification.service";

import {
  VaultTimeoutSettingsServiceInitOptions,
  vaultTimeoutSettingsServiceFactory,
} from "../../../background/service-factories/vault-timeout-settings-service.factory";
import {
  CryptoServiceInitOptions,
  cryptoServiceFactory,
} from "../../../platform/background/service-factories/crypto-service.factory";
import {
  FactoryOptions,
  CachedServices,
  factory,
} from "../../../platform/background/service-factories/factory-options";
import {
  I18nServiceInitOptions,
  i18nServiceFactory,
} from "../../../platform/background/service-factories/i18n-service.factory";
import {
  LogServiceInitOptions,
  logServiceFactory,
} from "../../../platform/background/service-factories/log-service.factory";
import {
  platformUtilsServiceFactory,
  PlatformUtilsServiceInitOptions,
} from "../../../platform/background/service-factories/platform-utils-service.factory";
import {
  StateServiceInitOptions,
  stateServiceFactory,
} from "../../../platform/background/service-factories/state-service.factory";

import { KdfConfigServiceInitOptions, kdfConfigServiceFactory } from "./kdf-config-service.factory";
import {
  KeyConnectorServiceInitOptions,
  keyConnectorServiceFactory,
} from "./key-connector-service.factory";
import { PinCryptoServiceInitOptions, pinCryptoServiceFactory } from "./pin-crypto-service.factory";
import {
  userDecryptionOptionsServiceFactory,
  UserDecryptionOptionsServiceInitOptions,
} from "./user-decryption-options-service.factory";
import {
  UserVerificationApiServiceInitOptions,
  userVerificationApiServiceFactory,
} from "./user-verification-api-service.factory";

type UserVerificationServiceFactoryOptions = FactoryOptions;

export type UserVerificationServiceInitOptions = UserVerificationServiceFactoryOptions &
  StateServiceInitOptions &
  CryptoServiceInitOptions &
  KeyConnectorServiceInitOptions &
  I18nServiceInitOptions &
  UserVerificationApiServiceInitOptions &
  UserDecryptionOptionsServiceInitOptions &
  PinCryptoServiceInitOptions &
  LogServiceInitOptions &
  VaultTimeoutSettingsServiceInitOptions &
  PlatformUtilsServiceInitOptions &
  KdfConfigServiceInitOptions;

export function userVerificationServiceFactory(
  cache: { userVerificationService?: AbstractUserVerificationService } & CachedServices,
  opts: UserVerificationServiceInitOptions,
): Promise<AbstractUserVerificationService> {
  return factory(
    cache,
    "userVerificationService",
    opts,
    async () =>
      new UserVerificationService(
        await stateServiceFactory(cache, opts),
        await cryptoServiceFactory(cache, opts),
        await keyConnectorServiceFactory(cache, opts),
        await i18nServiceFactory(cache, opts),
        await userVerificationApiServiceFactory(cache, opts),
        await userDecryptionOptionsServiceFactory(cache, opts),
        await pinCryptoServiceFactory(cache, opts),
        await logServiceFactory(cache, opts),
        await vaultTimeoutSettingsServiceFactory(cache, opts),
        await platformUtilsServiceFactory(cache, opts),
        await kdfConfigServiceFactory(cache, opts),
      ),
  );
}
