import {
  AuthRequestServiceAbstraction,
  LoginStrategyServiceAbstraction,
} from "@bitwarden/auth/common";
import { NotificationsService as NotificationsServiceAbstraction } from "@bitwarden/common/abstractions/notifications.service";
import { SearchService as SearchServiceAbstraction } from "@bitwarden/common/abstractions/search.service";
import { VaultTimeoutSettingsService as VaultTimeoutSettingsServiceAbstraction } from "@bitwarden/common/abstractions/vault-timeout/vault-timeout-settings.service";
import { AuthService as AuthServiceAbstraction } from "@bitwarden/common/auth/abstractions/auth.service";
import { DeviceTrustCryptoServiceAbstraction } from "@bitwarden/common/auth/abstractions/device-trust-crypto.service.abstraction";
import { DevicesServiceAbstraction } from "@bitwarden/common/auth/abstractions/devices/devices.service.abstraction";
import { KeyConnectorService as KeyConnectorServiceAbstraction } from "@bitwarden/common/auth/abstractions/key-connector.service";
import { SsoLoginServiceAbstraction } from "@bitwarden/common/auth/abstractions/sso-login.service.abstraction";
import { TwoFactorService as TwoFactorServiceAbstraction } from "@bitwarden/common/auth/abstractions/two-factor.service";
import { UserVerificationService as UserVerificationServiceAbstraction } from "@bitwarden/common/auth/abstractions/user-verification/user-verification.service.abstraction";
import { TwoFactorService } from "@bitwarden/common/auth/services/two-factor.service";
import { CryptoFunctionService as CryptoFunctionServiceAbstraction } from "@bitwarden/common/platform/abstractions/crypto-function.service";
import { CryptoService as CryptoServiceAbstraction } from "@bitwarden/common/platform/abstractions/crypto.service";
import { I18nService as I18nServiceAbstraction } from "@bitwarden/common/platform/abstractions/i18n.service";
import { KeyGenerationService as KeyGenerationServiceAbstraction } from "@bitwarden/common/platform/abstractions/key-generation.service";
import { LogService as LogServiceAbstraction } from "@bitwarden/common/platform/abstractions/log.service";
import { PlatformUtilsService as PlatformUtilsServiceAbstraction } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import {
  AbstractMemoryStorageService,
  AbstractStorageService,
  ObservableStorageService,
} from "@bitwarden/common/platform/abstractions/storage.service";
import { ConsoleLogService } from "@bitwarden/common/platform/services/console-log.service";
import { EncryptServiceImplementation } from "@bitwarden/common/platform/services/cryptography/encrypt.service.implementation";
import { KeyGenerationService } from "@bitwarden/common/platform/services/key-generation.service";
import { StorageServiceProvider } from "@bitwarden/common/platform/services/storage-service.provider";
import { WebCryptoFunctionService } from "@bitwarden/common/platform/services/web-crypto-function.service";
import { GlobalStateProvider } from "@bitwarden/common/platform/state";
/* eslint-disable import/no-restricted-paths -- We need the implementation to inject, but generally these should not be accessed */
import { DefaultGlobalStateProvider } from "@bitwarden/common/platform/state/implementations/default-global-state.provider";
/* eslint-enable import/no-restricted-paths */
import { PasswordGenerationServiceAbstraction } from "@bitwarden/common/tools/generator";
import { UsernameGenerationServiceAbstraction } from "@bitwarden/common/tools/generator/username";
import { CipherService as CipherServiceAbstraction } from "@bitwarden/common/vault/abstractions/cipher.service";
import { CollectionService as CollectionServiceAbstraction } from "@bitwarden/common/vault/abstractions/collection.service";
import { CipherFileUploadService as CipherFileUploadServiceAbstraction } from "@bitwarden/common/vault/abstractions/file-upload/cipher-file-upload.service";
import { SyncService as SyncServiceAbstraction } from "@bitwarden/common/vault/abstractions/sync/sync.service.abstraction";
import { TotpService as TotpServiceAbstraction } from "@bitwarden/common/vault/abstractions/totp.service";
import { VaultExportServiceAbstraction } from "@bitwarden/vault-export-core";

import { AutofillService as AutofillServiceAbstraction } from "../../autofill/services/abstractions/autofill.service";
import VaultTimeoutService from "../../services/vault-timeout/vault-timeout.service";
import { BrowserApi } from "../browser/browser-api";
import BrowserLocalStorageService from "../services/browser-local-storage.service";
import BrowserMemoryStorageService from "../services/browser-memory-storage.service";
import BrowserMessagingService from "../services/browser-messaging.service";
import I18nService from "../services/i18n.service";
import { LocalBackedSessionStorageService } from "../services/local-backed-session-storage.service";
import { BackgroundPlatformUtilsService } from "../services/platform-utils/background-platform-utils.service";
import { BackgroundMemoryStorageService } from "../storage/background-memory-storage.service";

export class PopupBgServices {
  // main getBgServices dependencies
  twoFactorService: TwoFactorServiceAbstraction;
  authService: AuthServiceAbstraction;
  loginStrategyService: LoginStrategyServiceAbstraction;
  ssoLoginService: SsoLoginServiceAbstraction;
  searchService: SearchServiceAbstraction;
  cipherFileUploadService: CipherFileUploadServiceAbstraction;
  cipherService: CipherServiceAbstraction;
  collectionService: CollectionServiceAbstraction;
  totpService: TotpServiceAbstraction;
  cryptoService: CryptoServiceAbstraction;
  authRequestService: AuthRequestServiceAbstraction;
  deviceTrustCryptoService: DeviceTrustCryptoServiceAbstraction;
  devicesService: DevicesServiceAbstraction;
  passwordGenerationService: PasswordGenerationServiceAbstraction;
  syncService: SyncServiceAbstraction;
  autofillService: AutofillServiceAbstraction;
  exportService: VaultExportServiceAbstraction;
  keyConnectorService: KeyConnectorServiceAbstraction;
  userVerificationService: UserVerificationServiceAbstraction;
  vaultTimeoutSettingsService: VaultTimeoutSettingsServiceAbstraction;
  vaultTimeoutService: VaultTimeoutService;
  notificationsService: NotificationsServiceAbstraction;
  memoryStorageService: AbstractMemoryStorageService;
  memoryStorageForStateProviders: AbstractMemoryStorageService & ObservableStorageService;
  usernameGenerationService: UsernameGenerationServiceAbstraction;

  // Required dependencies for getBgServices
  private readonly messagingService: BrowserMessagingService;
  private readonly logService: LogServiceAbstraction;
  private readonly cryptoFunctionService: CryptoFunctionServiceAbstraction;
  private readonly keyGenerationService: KeyGenerationServiceAbstraction;
  private readonly storageService: AbstractStorageService & ObservableStorageService;
  private readonly storageServiceProvider: StorageServiceProvider;
  private readonly globalStateProvider: GlobalStateProvider;
  private readonly i18nService: I18nServiceAbstraction;
  private readonly platformUtilsService: PlatformUtilsServiceAbstraction;

  constructor() {
    this.messagingService = new BrowserMessagingService();
    this.logService = new ConsoleLogService(false);
    this.cryptoFunctionService = new WebCryptoFunctionService(window);
    this.keyGenerationService = new KeyGenerationService(this.cryptoFunctionService);
    this.storageService = new BrowserLocalStorageService();
    this.memoryStorageForStateProviders = this.getMemoryStorageForStateProviders();
    this.storageServiceProvider = new StorageServiceProvider(
      this.storageService,
      this.memoryStorageForStateProviders,
    );
    this.globalStateProvider = new DefaultGlobalStateProvider(this.storageServiceProvider);
    this.i18nService = new I18nService(BrowserApi.getUILanguage(), this.globalStateProvider);
    this.platformUtilsService = new BackgroundPlatformUtilsService(
      this.messagingService,
      this.platformUtilsClipboardWriteCallback,
      this.platformUtilsBiometricCallback,
      window,
    );
    this.twoFactorService = new TwoFactorService(this.i18nService, this.platformUtilsService);
  }

  private platformUtilsClipboardWriteCallback = (clipboardValue: string, clearMs: number) => {
    void BrowserApi.sendMessage("clearClipboard", { clipboardValue, clearMs });
  };

  private platformUtilsBiometricCallback = async () => {
    const response = await BrowserApi.sendMessageWithResponse<{
      result: boolean;
      error: string;
    }>("biometricUnlock");
    if (!response.result) {
      throw response.error;
    }
    return response.result;
  };

  private mv3MemoryStorageCreator = (partitionName: string) => {
    return new LocalBackedSessionStorageService(
      new EncryptServiceImplementation(this.cryptoFunctionService, this.logService, false),
      this.keyGenerationService,
      new BrowserLocalStorageService(),
      new BrowserMemoryStorageService(),
      partitionName,
    );
  };

  private getMemoryStorageForStateProviders(): AbstractMemoryStorageService &
    ObservableStorageService {
    return BrowserApi.isManifestVersion(3)
      ? this.mv3MemoryStorageCreator("stateProviders")
      : new BackgroundMemoryStorageService();
  }
}
