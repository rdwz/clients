import { APP_INITIALIZER, NgModule } from "@angular/core";

import { SafeProvider, safeProvider } from "@bitwarden/angular/platform/utils/safe-provider";
import {
  SECURE_STORAGE,
  STATE_SERVICE_USE_CACHE,
  LOCALES_DIRECTORY,
  SYSTEM_LANGUAGE,
  MEMORY_STORAGE,
  OBSERVABLE_MEMORY_STORAGE,
  OBSERVABLE_DISK_STORAGE,
  WINDOW,
  SUPPORTS_SECURE_STORAGE,
  SYSTEM_THEME_OBSERVABLE,
  SafeInjectionToken,
  STATE_FACTORY,
} from "@bitwarden/angular/services/injection-tokens";
import { JslibServicesModule } from "@bitwarden/angular/services/jslib-services.module";
import { VaultTimeoutSettingsService } from "@bitwarden/common/abstractions/vault-timeout/vault-timeout-settings.service";
import { PolicyService as PolicyServiceAbstraction } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { AccountService as AccountServiceAbstraction } from "@bitwarden/common/auth/abstractions/account.service";
import { AuthService as AuthServiceAbstraction } from "@bitwarden/common/auth/abstractions/auth.service";
import { InternalMasterPasswordServiceAbstraction } from "@bitwarden/common/auth/abstractions/master-password.service.abstraction";
import { TokenService } from "@bitwarden/common/auth/abstractions/token.service";
import { AutofillSettingsServiceAbstraction } from "@bitwarden/common/autofill/services/autofill-settings.service";
import { BroadcasterService as BroadcasterServiceAbstraction } from "@bitwarden/common/platform/abstractions/broadcaster.service";
import { CryptoFunctionService as CryptoFunctionServiceAbstraction } from "@bitwarden/common/platform/abstractions/crypto-function.service";
import { CryptoService as CryptoServiceAbstraction } from "@bitwarden/common/platform/abstractions/crypto.service";
import { EncryptService } from "@bitwarden/common/platform/abstractions/encrypt.service";
import { EnvironmentService } from "@bitwarden/common/platform/abstractions/environment.service";
import { FileDownloadService } from "@bitwarden/common/platform/abstractions/file-download/file-download.service";
import { I18nService as I18nServiceAbstraction } from "@bitwarden/common/platform/abstractions/i18n.service";
import { KeyGenerationService as KeyGenerationServiceAbstraction } from "@bitwarden/common/platform/abstractions/key-generation.service";
import {
  LogService,
  LogService as LogServiceAbstraction,
} from "@bitwarden/common/platform/abstractions/log.service";
import { MessagingService as MessagingServiceAbstraction } from "@bitwarden/common/platform/abstractions/messaging.service";
import { PlatformUtilsService as PlatformUtilsServiceAbstraction } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { StateService as StateServiceAbstraction } from "@bitwarden/common/platform/abstractions/state.service";
import { AbstractStorageService } from "@bitwarden/common/platform/abstractions/storage.service";
import { SystemService as SystemServiceAbstraction } from "@bitwarden/common/platform/abstractions/system.service";
import { BiometricStateService } from "@bitwarden/common/platform/biometrics/biometric-state.service";
import { StateFactory } from "@bitwarden/common/platform/factories/state-factory";
import { GlobalState } from "@bitwarden/common/platform/models/domain/global-state";
import { MemoryStorageService } from "@bitwarden/common/platform/services/memory-storage.service";
import { MigrationRunner } from "@bitwarden/common/platform/services/migration-runner";
import { SystemService } from "@bitwarden/common/platform/services/system.service";
import { GlobalStateProvider, StateProvider } from "@bitwarden/common/platform/state";
// eslint-disable-next-line import/no-restricted-paths -- Implementation for memory storage
import { MemoryStorageService as MemoryStorageServiceForStateProviders } from "@bitwarden/common/platform/state/storage/memory-storage.service";
import { PasswordGenerationServiceAbstraction } from "@bitwarden/common/tools/generator/password";
import { CipherService as CipherServiceAbstraction } from "@bitwarden/common/vault/abstractions/cipher.service";
import { DialogService } from "@bitwarden/components";

import { LoginGuard } from "../../auth/guards/login.guard";
import { DesktopAutofillSettingsService } from "../../autofill/services/desktop-autofill-settings.service";
import { Account } from "../../models/account";
import { DesktopSettingsService } from "../../platform/services/desktop-settings.service";
import { ElectronCryptoService } from "../../platform/services/electron-crypto.service";
import { ElectronLogRendererService } from "../../platform/services/electron-log.renderer.service";
import {
  ELECTRON_SUPPORTS_SECURE_STORAGE,
  ElectronPlatformUtilsService,
} from "../../platform/services/electron-platform-utils.service";
import { ElectronRendererMessagingService } from "../../platform/services/electron-renderer-messaging.service";
import { ElectronRendererSecureStorageService } from "../../platform/services/electron-renderer-secure-storage.service";
import { ElectronRendererStorageService } from "../../platform/services/electron-renderer-storage.service";
import { ElectronStateService } from "../../platform/services/electron-state.service";
import { I18nRendererService } from "../../platform/services/i18n.renderer.service";
import { fromIpcSystemTheme } from "../../platform/utils/from-ipc-system-theme";
import { EncryptedMessageHandlerService } from "../../services/encrypted-message-handler.service";
import { NativeMessageHandlerService } from "../../services/native-message-handler.service";
import { NativeMessagingService } from "../../services/native-messaging.service";
import { SearchBarService } from "../layout/search/search-bar.service";

import { DesktopFileDownloadService } from "./desktop-file-download.service";
import { InitService } from "./init.service";
import { RendererCryptoFunctionService } from "./renderer-crypto-function.service";

const RELOAD_CALLBACK = new SafeInjectionToken<() => any>("RELOAD_CALLBACK");

// Desktop has its own Account definition which must be used in its StateService
const DESKTOP_STATE_FACTORY = new SafeInjectionToken<StateFactory<GlobalState, Account>>(
  "DESKTOP_STATE_FACTORY",
);

/**
 * Provider definitions used in the ngModule.
 * Add your provider definition here using the safeProvider function as a wrapper. This will give you type safety.
 * If you need help please ask for it, do NOT change the type of this array.
 */
const safeProviders: SafeProvider[] = [
  safeProvider(InitService),
  safeProvider(NativeMessagingService),
  safeProvider(SearchBarService),
  safeProvider(LoginGuard),
  safeProvider(DialogService),
  safeProvider({
    provide: APP_INITIALIZER as SafeInjectionToken<() => void>,
    useFactory: (initService: InitService) => initService.init(),
    deps: [InitService],
    multi: true,
  }),
  safeProvider({
    provide: DESKTOP_STATE_FACTORY,
    useValue: new StateFactory(GlobalState, Account),
  }),
  safeProvider({
    provide: STATE_FACTORY,
    useValue: null,
  }),
  safeProvider({
    provide: RELOAD_CALLBACK,
    useValue: null,
  }),
  safeProvider({
    provide: LogServiceAbstraction,
    useClass: ElectronLogRendererService,
    deps: [],
  }),
  safeProvider({
    provide: PlatformUtilsServiceAbstraction,
    useClass: ElectronPlatformUtilsService,
    deps: [I18nServiceAbstraction, MessagingServiceAbstraction],
  }),
  safeProvider({
    // We manually override the value of SUPPORTS_SECURE_STORAGE here to avoid
    // the TokenService having to inject the PlatformUtilsService which introduces a
    // circular dependency on Desktop only.
    provide: SUPPORTS_SECURE_STORAGE,
    useValue: ELECTRON_SUPPORTS_SECURE_STORAGE,
  }),
  safeProvider({
    provide: I18nServiceAbstraction,
    useClass: I18nRendererService,
    deps: [SYSTEM_LANGUAGE, LOCALES_DIRECTORY, GlobalStateProvider],
  }),
  safeProvider({
    provide: MessagingServiceAbstraction,
    useClass: ElectronRendererMessagingService,
    deps: [BroadcasterServiceAbstraction],
  }),
  safeProvider({
    provide: AbstractStorageService,
    useClass: ElectronRendererStorageService,
    deps: [],
  }),
  safeProvider({
    provide: SECURE_STORAGE,
    useClass: ElectronRendererSecureStorageService,
    deps: [],
  }),
  safeProvider({ provide: MEMORY_STORAGE, useClass: MemoryStorageService, deps: [] }),
  safeProvider({
    provide: OBSERVABLE_MEMORY_STORAGE,
    useClass: MemoryStorageServiceForStateProviders,
    deps: [],
  }),
  safeProvider({ provide: OBSERVABLE_DISK_STORAGE, useExisting: AbstractStorageService }),
  safeProvider({
    provide: SystemServiceAbstraction,
    useClass: SystemService,
    deps: [
      MessagingServiceAbstraction,
      PlatformUtilsServiceAbstraction,
      RELOAD_CALLBACK,
      StateServiceAbstraction,
      AutofillSettingsServiceAbstraction,
      VaultTimeoutSettingsService,
      BiometricStateService,
      AccountServiceAbstraction,
    ],
  }),
  safeProvider({
    provide: StateServiceAbstraction,
    useClass: ElectronStateService,
    deps: [
      AbstractStorageService,
      SECURE_STORAGE,
      MEMORY_STORAGE,
      LogService,
      DESKTOP_STATE_FACTORY,
      AccountServiceAbstraction,
      EnvironmentService,
      TokenService,
      MigrationRunner,
      STATE_SERVICE_USE_CACHE,
    ],
  }),
  safeProvider({
    provide: FileDownloadService,
    useClass: DesktopFileDownloadService,
    deps: [],
  }),
  safeProvider({
    provide: SYSTEM_THEME_OBSERVABLE,
    useFactory: () => fromIpcSystemTheme(),
    deps: [],
  }),
  safeProvider({
    provide: EncryptedMessageHandlerService,
    deps: [
      StateServiceAbstraction,
      AuthServiceAbstraction,
      CipherServiceAbstraction,
      PolicyServiceAbstraction,
      MessagingServiceAbstraction,
      PasswordGenerationServiceAbstraction,
      AccountServiceAbstraction,
    ],
  }),
  safeProvider({
    provide: NativeMessageHandlerService,
    deps: [
      StateServiceAbstraction,
      CryptoServiceAbstraction,
      CryptoFunctionServiceAbstraction,
      MessagingServiceAbstraction,
      EncryptedMessageHandlerService,
      DialogService,
      DesktopAutofillSettingsService,
    ],
  }),
  safeProvider({
    provide: CryptoFunctionServiceAbstraction,
    useClass: RendererCryptoFunctionService,
    deps: [WINDOW],
  }),
  safeProvider({
    provide: CryptoServiceAbstraction,
    useClass: ElectronCryptoService,
    deps: [
      InternalMasterPasswordServiceAbstraction,
      KeyGenerationServiceAbstraction,
      CryptoFunctionServiceAbstraction,
      EncryptService,
      PlatformUtilsServiceAbstraction,
      LogService,
      StateServiceAbstraction,
      AccountServiceAbstraction,
      StateProvider,
      BiometricStateService,
    ],
  }),
  safeProvider({
    provide: DesktopSettingsService,
    deps: [StateProvider],
  }),
  safeProvider({
    provide: DesktopAutofillSettingsService,
    deps: [StateProvider],
  }),
];

@NgModule({
  imports: [JslibServicesModule],
  declarations: [],
  // Do not register your dependency here! Add it to the typesafeProviders array using the helper function
  providers: safeProviders,
})
export class ServicesModule {}
