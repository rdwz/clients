import { firstValueFrom } from "rxjs";

import {
  AuthRequestServiceAbstraction,
  LoginEmailServiceAbstraction,
  LoginStrategyServiceAbstraction,
} from "@bitwarden/auth/common";
import { AuditService as AuditServiceAbstraction } from "@bitwarden/common/abstractions/audit.service";
import { EventCollectionService as EventCollectionServiceAbstraction } from "@bitwarden/common/abstractions/event/event-collection.service";
import { EventUploadService as EventUploadServiceAbstraction } from "@bitwarden/common/abstractions/event/event-upload.service";
import { NotificationsService as NotificationsServiceAbstraction } from "@bitwarden/common/abstractions/notifications.service";
import { SearchService as SearchServiceAbstraction } from "@bitwarden/common/abstractions/search.service";
import { VaultTimeoutSettingsService as VaultTimeoutSettingsServiceAbstraction } from "@bitwarden/common/abstractions/vault-timeout/vault-timeout-settings.service";
import { PolicyApiServiceAbstraction } from "@bitwarden/common/admin-console/abstractions/policy/policy-api.service.abstraction";
import { PolicyApiService } from "@bitwarden/common/admin-console/services/policy/policy-api.service";
import { AuthService as AuthServiceAbstraction } from "@bitwarden/common/auth/abstractions/auth.service";
import { DeviceTrustCryptoServiceAbstraction } from "@bitwarden/common/auth/abstractions/device-trust-crypto.service.abstraction";
import { DevicesServiceAbstraction } from "@bitwarden/common/auth/abstractions/devices/devices.service.abstraction";
import { KeyConnectorService as KeyConnectorServiceAbstraction } from "@bitwarden/common/auth/abstractions/key-connector.service";
import { SsoLoginServiceAbstraction } from "@bitwarden/common/auth/abstractions/sso-login.service.abstraction";
import { TwoFactorService as TwoFactorServiceAbstraction } from "@bitwarden/common/auth/abstractions/two-factor.service";
import { UserVerificationService as UserVerificationServiceAbstraction } from "@bitwarden/common/auth/abstractions/user-verification/user-verification.service.abstraction";
import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";
import { ForceSetPasswordReason } from "@bitwarden/common/auth/models/domain/force-set-password-reason";
import {
  BadgeSettingsServiceAbstraction,
  BadgeSettingsService,
} from "@bitwarden/common/autofill/services/badge-settings.service";
import {
  UserNotificationSettingsService,
  UserNotificationSettingsServiceAbstraction,
} from "@bitwarden/common/autofill/services/user-notification-settings.service";
import { CryptoService as CryptoServiceAbstraction } from "@bitwarden/common/platform/abstractions/crypto.service";
import { LogService as LogServiceAbstraction } from "@bitwarden/common/platform/abstractions/log.service";
import { MessagingService as MessagingServiceAbstraction } from "@bitwarden/common/platform/abstractions/messaging.service";
import {
  AbstractMemoryStorageService,
  ObservableStorageService,
} from "@bitwarden/common/platform/abstractions/storage.service";
import { SystemService as SystemServiceAbstraction } from "@bitwarden/common/platform/abstractions/system.service";
import { ScheduledTaskNames } from "@bitwarden/common/platform/enums/scheduled-task-name.enum";
import { ContainerService } from "@bitwarden/common/platform/services/container.service";
import { SystemService } from "@bitwarden/common/platform/services/system.service";
import { DefaultThemeStateService } from "@bitwarden/common/platform/theming/theme-state.service";
import { AuditService } from "@bitwarden/common/services/audit.service";
import { EventCollectionService } from "@bitwarden/common/services/event/event-collection.service";
import { EventUploadService } from "@bitwarden/common/services/event/event-upload.service";
import { PasswordGenerationServiceAbstraction } from "@bitwarden/common/tools/generator";
import { UsernameGenerationServiceAbstraction } from "@bitwarden/common/tools/generator/abstractions/username-generation.service.abstraction";
import { UserId } from "@bitwarden/common/types/guid";
import { CipherService as CipherServiceAbstraction } from "@bitwarden/common/vault/abstractions/cipher.service";
import { CollectionService as CollectionServiceAbstraction } from "@bitwarden/common/vault/abstractions/collection.service";
import { Fido2AuthenticatorService as Fido2AuthenticatorServiceAbstraction } from "@bitwarden/common/vault/abstractions/fido2/fido2-authenticator.service.abstraction";
import { Fido2ClientService as Fido2ClientServiceAbstraction } from "@bitwarden/common/vault/abstractions/fido2/fido2-client.service.abstraction";
import { Fido2UserInterfaceService as Fido2UserInterfaceServiceAbstraction } from "@bitwarden/common/vault/abstractions/fido2/fido2-user-interface.service.abstraction";
import { CipherFileUploadService as CipherFileUploadServiceAbstraction } from "@bitwarden/common/vault/abstractions/file-upload/cipher-file-upload.service";
import { SyncNotifierService as SyncNotifierServiceAbstraction } from "@bitwarden/common/vault/abstractions/sync/sync-notifier.service.abstraction";
import { SyncService as SyncServiceAbstraction } from "@bitwarden/common/vault/abstractions/sync/sync.service.abstraction";
import { TotpService as TotpServiceAbstraction } from "@bitwarden/common/vault/abstractions/totp.service";
import { VaultSettingsService as VaultSettingsServiceAbstraction } from "@bitwarden/common/vault/abstractions/vault-settings/vault-settings.service";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { Fido2AuthenticatorService } from "@bitwarden/common/vault/services/fido2/fido2-authenticator.service";
import { Fido2ClientService } from "@bitwarden/common/vault/services/fido2/fido2-client.service";
import { SyncNotifierService } from "@bitwarden/common/vault/services/sync/sync-notifier.service";
import { VaultSettingsService } from "@bitwarden/common/vault/services/vault-settings/vault-settings.service";
import {
  ImportApiService,
  ImportApiServiceAbstraction,
  ImportService,
  ImportServiceAbstraction,
} from "@bitwarden/importer/core";
import { VaultExportServiceAbstraction } from "@bitwarden/vault-export-core";

import ContextMenusBackground from "../autofill/background/context-menus.background";
import NotificationBackground from "../autofill/background/notification.background";
import OverlayBackground from "../autofill/background/overlay.background";
import TabsBackground from "../autofill/background/tabs.background";
// import WebRequestBackground from "../autofill/background/web-request.background";
import { CipherContextMenuHandler } from "../autofill/browser/cipher-context-menu-handler";
import { ContextMenuClickedHandler } from "../autofill/browser/context-menu-clicked-handler";
import { MainContextMenuHandler } from "../autofill/browser/main-context-menu-handler";
import { AutofillService as AutofillServiceAbstraction } from "../autofill/services/abstractions/autofill.service";
import AutofillService from "../autofill/services/autofill.service";
import { SafariApp } from "../browser/safariApp";
import { BrowserApi } from "../platform/browser/browser-api";
import { UpdateBadge } from "../platform/listeners/update-badge";
import I18nService from "../platform/services/i18n.service";
import { BrowserPlatformUtilsService } from "../platform/services/platform-utils/browser-platform-utils.service";
import VaultTimeoutService from "../services/vault-timeout/vault-timeout.service";
import FilelessImporterBackground from "../tools/background/fileless-importer.background";
import { Fido2Background as Fido2BackgroundAbstraction } from "../vault/fido2/background/abstractions/fido2.background";
import Fido2Background from "../vault/fido2/background/fido2.background";
import { BrowserFido2UserInterfaceService } from "../vault/fido2/browser-fido2-user-interface.service";
import { VaultFilterService } from "../vault/services/vault-filter.service";

import CommandsBackground from "./commands.background";
import IdleBackground from "./idle.background";
import { NativeMessagingBackground } from "./nativeMessaging.background";
import RuntimeBackground from "./runtime.background";
import { SharedBgServicesContainer } from "./shared-bg-services-container.singleton";

export default class MainBackground {
  bgServices: SharedBgServicesContainer;

  // used in other contexts
  messagingService: MessagingServiceAbstraction;
  logService: LogServiceAbstraction;

  // remaining vault popup getBgServices dependencies
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
  exportService: VaultExportServiceAbstraction;
  keyConnectorService: KeyConnectorServiceAbstraction;
  userVerificationService: UserVerificationServiceAbstraction;
  vaultTimeoutSettingsService: VaultTimeoutSettingsServiceAbstraction;
  vaultTimeoutService: VaultTimeoutService;
  notificationsService: NotificationsServiceAbstraction;
  memoryStorageService: AbstractMemoryStorageService;
  memoryStorageForStateProviders: AbstractMemoryStorageService & ObservableStorageService;
  usernameGenerationService: UsernameGenerationServiceAbstraction;

  autofillService: AutofillServiceAbstraction;
  containerService: ContainerService;
  auditService: AuditServiceAbstraction;
  loginEmailService: LoginEmailServiceAbstraction;
  importApiService: ImportApiServiceAbstraction;
  importService: ImportServiceAbstraction;
  userNotificationSettingsService: UserNotificationSettingsServiceAbstraction;
  badgeSettingsService: BadgeSettingsServiceAbstraction;
  systemService: SystemServiceAbstraction;
  eventCollectionService: EventCollectionServiceAbstraction;
  eventUploadService: EventUploadServiceAbstraction;
  vaultFilterService: VaultFilterService;
  policyApiService: PolicyApiServiceAbstraction;
  syncNotifierService: SyncNotifierServiceAbstraction;
  fido2UserInterfaceService: Fido2UserInterfaceServiceAbstraction;
  fido2AuthenticatorService: Fido2AuthenticatorServiceAbstraction;
  fido2ClientService: Fido2ClientServiceAbstraction;
  mainContextMenuHandler: MainContextMenuHandler;
  cipherContextMenuHandler: CipherContextMenuHandler;
  fido2Background: Fido2BackgroundAbstraction;
  vaultSettingsService: VaultSettingsServiceAbstraction;

  onUpdatedRan: boolean;
  onReplacedRan: boolean;
  loginToAutoFill: CipherView = null;

  private commandsBackground: CommandsBackground;
  private contextMenusBackground: ContextMenusBackground;
  private idleBackground: IdleBackground;
  private notificationBackground: NotificationBackground;
  private overlayBackground: OverlayBackground;
  private filelessImporterBackground: FilelessImporterBackground;
  private runtimeBackground: RuntimeBackground;
  private tabsBackground: TabsBackground;
  // private webRequestBackground: WebRequestBackground;

  private nativeMessagingBackground: NativeMessagingBackground;

  isPrivateMode = false;

  constructor() {
    this.bgServices = new SharedBgServicesContainer(
      false,
      this.clearClipboard,
      this.biometricUnlock,
      this.logout,
      this.lockExtension,
      this.getBackgroundMessagingService(),
    );
    this.messagingService = this.bgServices.messagingService;
    this.logService = this.bgServices.logService;
    this.twoFactorService = this.bgServices.twoFactorService;
    this.authService = this.bgServices.authService;
    this.loginStrategyService = this.bgServices.loginStrategyService;
    this.ssoLoginService = this.bgServices.ssoLoginService;
    this.searchService = this.bgServices.searchService;
    this.cipherFileUploadService = this.bgServices.cipherFileUploadService;
    this.cipherService = this.bgServices.cipherService;
    this.collectionService = this.bgServices.collectionService;
    this.totpService = this.bgServices.totpService;
    this.cryptoService = this.bgServices.cryptoService;
    this.authRequestService = this.bgServices.authRequestService;
    this.deviceTrustCryptoService = this.bgServices.deviceTrustCryptoService;
    this.devicesService = this.bgServices.devicesService;
    this.passwordGenerationService = this.bgServices.passwordGenerationService;
    this.syncService = this.bgServices.syncService;
    this.exportService = this.bgServices.exportService;
    this.keyConnectorService = this.bgServices.keyConnectorService;
    this.userVerificationService = this.bgServices.userVerificationService;
    this.vaultTimeoutSettingsService = this.bgServices.vaultTimeoutSettingsService;
    this.vaultTimeoutService = this.bgServices.vaultTimeoutService;
    this.notificationsService = this.bgServices.notificationsService;
    this.memoryStorageService = this.bgServices.memoryStorageService;
    this.memoryStorageForStateProviders = this.bgServices.memoryStorageForStateProviders;
    this.usernameGenerationService = this.bgServices.usernameGenerationService;

    this.userNotificationSettingsService = new UserNotificationSettingsService(
      this.bgServices.stateProvider,
    );
    const themeStateService = new DefaultThemeStateService(this.bgServices.globalStateProvider);
    this.syncNotifierService = new SyncNotifierService();
    this.badgeSettingsService = new BadgeSettingsService(this.bgServices.stateProvider);
    this.policyApiService = new PolicyApiService(
      this.bgServices.policyService,
      this.bgServices.apiService,
    );
    this.vaultFilterService = new VaultFilterService(
      this.bgServices.organizationService,
      this.bgServices.folderService,
      this.cipherService,
      this.collectionService,
      this.bgServices.policyService,
      this.bgServices.stateProvider,
      this.bgServices.accountService,
    );
    this.vaultSettingsService = new VaultSettingsService(this.bgServices.stateProvider);
    this.containerService = new ContainerService(
      this.cryptoService,
      this.bgServices.encryptService,
    );
    this.eventUploadService = new EventUploadService(
      this.bgServices.apiService,
      this.bgServices.stateProvider,
      this.logService,
      this.bgServices.accountService,
      this.bgServices.taskSchedulerService,
    );
    this.eventCollectionService = new EventCollectionService(
      this.cipherService,
      this.bgServices.stateProvider,
      this.bgServices.organizationService,
      this.eventUploadService,
      this.bgServices.accountService,
    );
    this.autofillService = new AutofillService(
      this.cipherService,
      this.bgServices.autofillSettingsService,
      this.totpService,
      this.eventCollectionService,
      this.logService,
      this.bgServices.domainSettingsService,
      this.userVerificationService,
      this.bgServices.billingAccountProfileStateService,
    );
    this.auditService = new AuditService(
      this.bgServices.cryptoFunctionService,
      this.bgServices.apiService,
    );
    this.importApiService = new ImportApiService(this.bgServices.apiService);
    this.importService = new ImportService(
      this.cipherService,
      this.bgServices.folderService,
      this.importApiService,
      this.bgServices.i18nService,
      this.collectionService,
      this.cryptoService,
    );
    this.fido2UserInterfaceService = new BrowserFido2UserInterfaceService(this.authService);
    this.fido2AuthenticatorService = new Fido2AuthenticatorService(
      this.cipherService,
      this.fido2UserInterfaceService,
      this.syncService,
      this.logService,
    );
    this.fido2ClientService = new Fido2ClientService(
      this.fido2AuthenticatorService,
      this.bgServices.configService,
      this.authService,
      this.vaultSettingsService,
      this.bgServices.domainSettingsService,
      this.bgServices.taskSchedulerService,
      this.logService,
    );
    const systemUtilsServiceReloadCallback = () => {
      const forceWindowReload =
        this.bgServices.platformUtilsService.isSafari() ||
        this.bgServices.platformUtilsService.isFirefox() ||
        this.bgServices.platformUtilsService.isOpera();
      BrowserApi.reloadExtension(forceWindowReload ? self : null);
      return Promise.resolve();
    };
    this.systemService = new SystemService(
      this.messagingService,
      this.bgServices.platformUtilsService,
      systemUtilsServiceReloadCallback,
      this.bgServices.stateService,
      this.bgServices.autofillSettingsService,
      this.vaultTimeoutSettingsService,
      this.bgServices.biometricStateService,
      this.bgServices.taskSchedulerService,
    );

    // Background
    this.fido2Background = new Fido2Background(
      this.logService,
      this.fido2ClientService,
      this.vaultSettingsService,
    );
    this.runtimeBackground = new RuntimeBackground(
      this,
      this.autofillService,
      this.bgServices.platformUtilsService as BrowserPlatformUtilsService,
      this.notificationsService,
      this.bgServices.stateService,
      this.bgServices.autofillSettingsService,
      this.systemService,
      this.bgServices.environmentService,
      this.messagingService,
      this.logService,
      this.bgServices.configService,
      this.fido2Background,
    );
    this.nativeMessagingBackground = new NativeMessagingBackground(
      this.cryptoService,
      this.bgServices.cryptoFunctionService,
      this.runtimeBackground,
      this.messagingService,
      this.bgServices.appIdService,
      this.bgServices.platformUtilsService,
      this.bgServices.stateService,
      this.logService,
      this.authService,
      this.bgServices.biometricStateService,
    );
    this.commandsBackground = new CommandsBackground(
      this,
      this.passwordGenerationService,
      this.bgServices.platformUtilsService,
      this.vaultTimeoutService,
      this.authService,
    );
    this.notificationBackground = new NotificationBackground(
      this.autofillService,
      this.cipherService,
      this.authService,
      this.bgServices.policyService,
      this.bgServices.folderService,
      this.bgServices.stateService,
      this.userNotificationSettingsService,
      this.bgServices.domainSettingsService,
      this.bgServices.environmentService,
      this.logService,
      themeStateService,
    );
    this.overlayBackground = new OverlayBackground(
      this.cipherService,
      this.autofillService,
      this.authService,
      this.bgServices.environmentService,
      this.bgServices.domainSettingsService,
      this.bgServices.stateService,
      this.bgServices.autofillSettingsService,
      this.bgServices.i18nService,
      this.bgServices.platformUtilsService,
      themeStateService,
    );
    this.filelessImporterBackground = new FilelessImporterBackground(
      this.bgServices.configService,
      this.authService,
      this.bgServices.policyService,
      this.notificationBackground,
      this.importService,
      this.syncService,
    );
    this.tabsBackground = new TabsBackground(
      this,
      this.notificationBackground,
      this.overlayBackground,
    );
    const contextMenuClickedHandler = new ContextMenuClickedHandler(
      (options) => this.bgServices.platformUtilsService.copyToClipboard(options.text),
      async (_tab) => {
        const options = (await this.passwordGenerationService.getOptions())?.[0] ?? {};
        const password = await this.passwordGenerationService.generatePassword(options);
        this.bgServices.platformUtilsService.copyToClipboard(password);
        void this.passwordGenerationService.addHistory(password);
      },
      async (tab, cipher) => {
        this.loginToAutoFill = cipher;
        if (tab == null) {
          return;
        }

        // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        BrowserApi.tabSendMessage(tab, {
          command: "collectPageDetails",
          tab: tab,
          sender: "contextMenu",
        });
      },
      this.authService,
      this.cipherService,
      this.bgServices.stateService,
      this.totpService,
      this.eventCollectionService,
      this.userVerificationService,
    );

    this.contextMenusBackground = new ContextMenusBackground(contextMenuClickedHandler);

    this.idleBackground = new IdleBackground(
      this.vaultTimeoutService,
      this.bgServices.stateService,
      this.notificationsService,
      this.bgServices.accountService,
    );
    this.mainContextMenuHandler = new MainContextMenuHandler(
      this.bgServices.stateService,
      this.bgServices.autofillSettingsService,
      this.bgServices.i18nService,
      this.logService,
      this.bgServices.billingAccountProfileStateService,
    );

    this.cipherContextMenuHandler = new CipherContextMenuHandler(
      this.mainContextMenuHandler,
      this.authService,
      this.cipherService,
    );
  }

  lockExtension = async () => {
    if (this.notificationsService != null) {
      void this.notificationsService.updateConnection(false);
    }
    await this.refreshBadge();
    await this.refreshMenu(true);
    if (this.systemService != null) {
      await this.systemService.clearPendingClipboard();
      await this.systemService.startProcessReload(this.authService);
    }
  };

  async bootstrap() {
    this.containerService.attachToGlobal(self);

    await this.bgServices.stateService.init();

    await (this.bgServices.i18nService as I18nService).init();
    await (this.eventUploadService as EventUploadService).init(true);
    this.twoFactorService.init();

    this.fido2Background.init();
    await this.vaultTimeoutService.init(true);
    await this.runtimeBackground.init();
    await this.notificationBackground.init();
    this.filelessImporterBackground.init();
    await this.commandsBackground.init();
    await this.overlayBackground.init();
    await this.tabsBackground.init();
    this.contextMenusBackground?.init();
    await this.idleBackground.init();
    // await this.webRequestBackground.init();

    if (this.bgServices.platformUtilsService.isFirefox() && !this.isPrivateMode) {
      // Set Private Mode windows to the default icon - they do not share state with the background page
      const privateWindows = await BrowserApi.getPrivateModeWindows();
      privateWindows.forEach(async (win) => {
        await new UpdateBadge(self).setBadgeIcon("", win.id);
      });

      // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      BrowserApi.onWindowCreated(async (win) => {
        if (win.incognito) {
          await new UpdateBadge(self).setBadgeIcon("", win.id);
        }
      });
    }

    return new Promise<void>((resolve) => {
      setTimeout(async () => {
        if (!this.isPrivateMode) {
          await this.refreshBadge();
        }

        await this.fullSync(true);
        await this.bgServices.taskSchedulerService.setInterval(
          () => this.fullSync(),
          5 * 60 * 1000, // check every 5 minutes
          ScheduledTaskNames.scheduleNextSyncInterval,
        );
        setTimeout(() => this.notificationsService.init(), 2500);
        resolve();
      }, 500);
    });
  }

  async refreshBadge() {
    await new UpdateBadge(self).run({ existingServices: this as any });
  }

  async refreshMenu(forLocked = false) {
    if (!chrome.windows || !chrome.contextMenus) {
      return;
    }

    await MainContextMenuHandler.removeAll();

    if (forLocked) {
      await this.mainContextMenuHandler?.noAccess();
      this.onUpdatedRan = this.onReplacedRan = false;
      return;
    }

    await this.mainContextMenuHandler?.init();

    const tab = await BrowserApi.getTabFromCurrentWindow();
    if (tab) {
      await this.cipherContextMenuHandler?.update(tab.url);
      this.onUpdatedRan = this.onReplacedRan = false;
    }
  }

  /**
   * Switch accounts to indicated userId -- null is no active user
   */
  async switchAccount(userId: UserId) {
    try {
      await this.bgServices.stateService.setActiveUser(userId);

      if (userId == null) {
        this.loginEmailService.setRememberEmail(false);
        await this.loginEmailService.saveEmailSettings();

        await this.refreshBadge();
        await this.refreshMenu();
        await this.overlayBackground.updateOverlayCiphers();
        return;
      }

      const status = await this.authService.getAuthStatus(userId);
      const forcePasswordReset =
        (await this.bgServices.stateService.getForceSetPasswordReason({ userId: userId })) !=
        ForceSetPasswordReason.None;

      await this.systemService.clearPendingClipboard();
      await this.notificationsService.updateConnection(false);

      if (status === AuthenticationStatus.Locked) {
        this.messagingService.send("locked", { userId: userId });
      } else if (forcePasswordReset) {
        this.messagingService.send("update-temp-password", { userId: userId });
      } else {
        this.messagingService.send("unlocked", { userId: userId });
        await this.refreshBadge();
        await this.refreshMenu();
        await this.overlayBackground.updateOverlayCiphers();
        await this.syncService.fullSync(false);
      }
    } finally {
      this.messagingService.send("switchAccountFinish", { userId: userId });
    }
  }

  async logout(expired: boolean, userId?: UserId) {
    userId ??= (await firstValueFrom(this.bgServices.accountService.activeAccount$))?.id;

    await this.eventUploadService.uploadEvents(userId as UserId);
    await this.bgServices.taskSchedulerService.clearAllScheduledTasks();

    await Promise.all([
      this.syncService.setLastSync(new Date(0), userId),
      this.cryptoService.clearKeys(userId),
      this.cipherService.clear(userId),
      this.bgServices.folderService.clear(userId),
      this.collectionService.clear(userId),
      this.bgServices.policyService.clear(userId),
      this.passwordGenerationService.clear(userId),
      this.vaultTimeoutSettingsService.clear(userId),
      this.vaultFilterService.clear(),
      this.bgServices.biometricStateService.logout(userId),
      this.bgServices.providerService.save(null, userId),
      /* We intentionally do not clear:
       *  - autofillSettingsService
       *  - badgeSettingsService
       *  - userNotificationSettingsService
       */
    ]);

    //Needs to be checked before state is cleaned
    const needStorageReseed = await this.needsStorageReseed();

    const currentUserId = await this.bgServices.stateService.getUserId();
    const newActiveUser = await this.bgServices.stateService.clean({ userId: userId });

    if (userId == null || userId === currentUserId) {
      this.searchService.clearIndex();
    }

    await this.bgServices.stateEventRunnerService.handleEvent("logout", currentUserId as UserId);

    if (newActiveUser != null) {
      // we have a new active user, do not continue tearing down application
      await this.switchAccount(newActiveUser as UserId);
      this.messagingService.send("switchAccountFinish");
    } else {
      this.messagingService.send("doneLoggingOut", { expired: expired, userId: userId });
    }

    if (needStorageReseed) {
      await this.reseedStorage();
    }

    if (BrowserApi.isManifestVersion(3)) {
      // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      BrowserApi.sendMessage("updateBadge");
    }
    await this.refreshBadge();
    await this.mainContextMenuHandler?.noAccess();
    // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.notificationsService.updateConnection(false);
    await this.systemService.clearPendingClipboard();
    await this.systemService.startProcessReload(this.authService);
  }

  private async needsStorageReseed(): Promise<boolean> {
    const currentVaultTimeout = await this.bgServices.stateService.getVaultTimeout();
    return currentVaultTimeout == null ? false : true;
  }

  async collectPageDetailsForContentScript(tab: any, sender: string, frameId: number = null) {
    if (tab == null || !tab.id) {
      return;
    }

    const options: any = {};
    if (frameId != null) {
      options.frameId = frameId;
    }

    // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    BrowserApi.tabSendMessage(
      tab,
      {
        command: "collectPageDetails",
        tab: tab,
        sender: sender,
      },
      options,
    );
  }

  async openPopup() {
    // Chrome APIs cannot open popup

    // TODO: Do we need to open this popup?
    if (!this.bgServices.platformUtilsService.isSafari()) {
      return;
    }
    await SafariApp.sendMessageToApp("showPopover", null, true);
  }

  async reseedStorage() {
    if (
      !this.bgServices.platformUtilsService.isChrome() &&
      !this.bgServices.platformUtilsService.isVivaldi() &&
      !this.bgServices.platformUtilsService.isOpera()
    ) {
      return;
    }

    const getStorage = (): Promise<any> =>
      new Promise((resolve) => {
        chrome.storage.local.get(null, (o: any) => resolve(o));
      });

    const clearStorage = (): Promise<void> =>
      new Promise((resolve) => {
        chrome.storage.local.clear(() => resolve());
      });

    const storage = await getStorage();
    await clearStorage();

    for (const key in storage) {
      // eslint-disable-next-line
      if (!storage.hasOwnProperty(key)) {
        continue;
      }
      await this.bgServices.storageService.save(key, storage[key]);
    }
  }

  clearClipboard = async (clipboardValue: string, clearMs: number) => {
    if (this.systemService != null) {
      await this.systemService.clearClipboard(clipboardValue, clearMs);
    }
  };

  biometricUnlock = async (): Promise<boolean> => {
    if (this.nativeMessagingBackground == null) {
      return false;
    }

    const responsePromise = this.nativeMessagingBackground.getResponse();
    await this.nativeMessagingBackground.send({ command: "biometricUnlock" });
    const response = await responsePromise;
    return response.response === "unlocked";
  };

  private async fullSync(override = false) {
    const syncInternal = 6 * 60 * 60 * 1000; // 6 hours
    const lastSync = await this.syncService.getLastSync();

    let lastSyncAgo = syncInternal + 1;
    if (lastSync != null) {
      lastSyncAgo = new Date().getTime() - lastSync.getTime();
    }

    if (override || lastSyncAgo >= syncInternal) {
      await this.syncService.fullSync(override);
    }
  }

  private getBackgroundMessagingService = (): MessagingServiceAbstraction => {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this;
    return new (class extends MessagingServiceAbstraction {
      // AuthService should send the messages to the background not popup.
      send = (subscriber: string, arg: any = {}) => {
        const message = Object.assign({}, { command: subscriber }, arg);
        void context.runtimeBackground.processMessage(message, context as any);
      };
    })();
  };
}
