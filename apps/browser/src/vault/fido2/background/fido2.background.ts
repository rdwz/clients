import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import {
  AssertCredentialParams,
  AssertCredentialResult,
  CreateCredentialParams,
  CreateCredentialResult,
  Fido2ClientService,
} from "@bitwarden/common/vault/abstractions/fido2/fido2-client.service.abstraction";
import { VaultSettingsService } from "@bitwarden/common/vault/abstractions/vault-settings/vault-settings.service";

import { BrowserApi } from "../../../platform/browser/browser-api";
import { AbortManager } from "../../background/abort-manager";
import { Fido2Port } from "../enums/fido2-port.enum";

import {
  Fido2Background as Fido2BackgroundInterface,
  Fido2BackgroundExtensionMessageHandlers,
  Fido2ExtensionMessage,
} from "./abstractions/fido2.background";

export default class Fido2Background implements Fido2BackgroundInterface {
  private abortManager = new AbortManager();
  private fido2ContentScriptPortsSet = new Set<chrome.runtime.Port>();
  private currentEnablePasskeysSetting: boolean;
  private extensionMessageHandlers: Fido2BackgroundExtensionMessageHandlers = {
    fido2AbortRequest: ({ message }) => this.abortRequest(message),
    fido2RegisterCredentialRequest: ({ message, sender }) =>
      this.registerCredentialRequest(message, sender),
    fido2GetCredentialRequest: ({ message, sender }) => this.getCredentialRequest(message, sender),
  };

  constructor(
    private logService: LogService,
    private fido2ClientService: Fido2ClientService,
    private vaultSettingsService: VaultSettingsService,
  ) {}

  /**
   * Initializes the FIDO2 background service. Sets up the extension message
   * and port listeners. Subscribes to the enablePasskeys$ observable to
   * handle passkey enable/disable events.
   */
  init() {
    BrowserApi.messageListener("fido2.background", this.handleExtensionMessage);
    BrowserApi.addListener(chrome.runtime.onConnect, this.handleInjectedScriptPortConnection);
    this.vaultSettingsService.enablePasskeys$.subscribe(this.handleEnablePasskeysUpdate.bind(this));
  }

  /**
   * Injects the FIDO2 content and page script into all existing browser tabs.
   */
  async injectFido2ContentScriptsInAllTabs() {
    const tabs = await BrowserApi.tabsQuery({});
    for (let index = 0; index < tabs.length; index++) {
      const tab = tabs[index];
      if (!tab.url?.startsWith("https")) {
        continue;
      }

      void this.injectFido2ContentScripts(tab);
    }
  }

  /**
   * Handles reacting to the enablePasskeys setting being updated. If the setting
   * is enabled, the FIDO2 content scripts are injected into all tabs. If the setting
   * is disabled, the FIDO2 content scripts will be from all tabs. This logic will
   * not trigger until after the first setting update.
   *
   * @param enablePasskeys - The new value of the enablePasskeys setting.
   */
  private handleEnablePasskeysUpdate(enablePasskeys: boolean) {
    const previousEnablePasskeysSetting = this.currentEnablePasskeysSetting;
    this.currentEnablePasskeysSetting = enablePasskeys;
    if (typeof previousEnablePasskeysSetting === "undefined") {
      return;
    }

    this.destroyLoadedFido2ContentScripts();
    if (enablePasskeys) {
      void this.injectFido2ContentScriptsInAllTabs();
    }
  }

  /**
   * Injects the FIDO2 content and page script into the current tab.
   *
   * @param tab - The current tab to inject the scripts into.
   */
  private async injectFido2ContentScripts(tab: chrome.tabs.Tab): Promise<void> {
    const sharedInjectionDetails = { allFrames: true, runAt: "document_start" };

    this.injectFido2PageScript(tab, sharedInjectionDetails);
    void BrowserApi.executeScriptInTab(tab.id, {
      file: "content/fido2/content-script.js",
      ...sharedInjectionDetails,
    });
  }

  /**
   * Injects the FIDO2 page script into the current tab.
   *
   * @param tab - The current tab to inject the script into.
   * @param sharedInjectionDetails - The shared injection details for the script.
   */
  private injectFido2PageScript(
    tab: chrome.tabs.Tab,
    sharedInjectionDetails: { allFrames: boolean; runAt: string },
  ) {
    if (BrowserApi.isManifestVersion(3)) {
      void BrowserApi.executeScriptInTab(
        tab.id,
        { file: "content/fido2/page-script.js", ...sharedInjectionDetails },
        { world: "MAIN" },
      );
      return;
    }

    void BrowserApi.executeScriptInTab(tab.id, {
      file: "content/fido2/page-script-append-mv2.js",
      ...sharedInjectionDetails,
    });
  }

  /**
   * Iterates over the set of injected FIDO2 content script ports
   * and disconnects them, destroying the content scripts.
   */
  private destroyLoadedFido2ContentScripts() {
    this.fido2ContentScriptPortsSet.forEach((port) => {
      port.disconnect();
      this.fido2ContentScriptPortsSet.delete(port);
    });
  }

  private abortRequest(message: Fido2ExtensionMessage) {
    this.abortManager.abort(message.abortedRequestId);
  }

  private async registerCredentialRequest(
    message: Fido2ExtensionMessage,
    sender: chrome.runtime.MessageSender,
  ): Promise<CreateCredentialResult> {
    return await this.handleCredentialRequest<CreateCredentialResult>(
      message,
      sender.tab,
      this.fido2ClientService.createCredential.bind(this.fido2ClientService),
    );
  }

  private async getCredentialRequest(
    message: Fido2ExtensionMessage,
    sender: chrome.runtime.MessageSender,
  ): Promise<AssertCredentialResult> {
    return await this.handleCredentialRequest<AssertCredentialResult>(
      message,
      sender.tab,
      this.fido2ClientService.assertCredential.bind(this.fido2ClientService),
    );
  }

  private handleCredentialRequest = async <T>(
    { requestId, data }: Fido2ExtensionMessage,
    tab: chrome.tabs.Tab,
    callback: (
      data: AssertCredentialParams | CreateCredentialParams,
      tab: chrome.tabs.Tab,
      abortController: AbortController,
    ) => Promise<T>,
  ) => {
    return await this.abortManager.runWithAbortController(requestId, async (abortController) => {
      try {
        return await callback(data, tab, abortController);
      } finally {
        await BrowserApi.focusTab(tab.id);
        await BrowserApi.focusWindow(tab.windowId);
      }
    });
  };

  private handleExtensionMessage = (
    message: Fido2ExtensionMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void,
  ) => {
    const handler: CallableFunction | undefined = this.extensionMessageHandlers[message?.command];
    if (!handler) {
      return;
    }

    const messageResponse = handler({ message, sender });
    if (!messageResponse) {
      return;
    }

    Promise.resolve(messageResponse)
      .then(
        (response) => sendResponse(response),
        (error) => sendResponse({ error: { ...error, message: error.message } }),
      )
      .catch(this.logService.error);

    return true;
  };

  private handleInjectedScriptPortConnection = async (port: chrome.runtime.Port) => {
    if (port.name !== Fido2Port.InjectedScript || !port.sender?.url) {
      return;
    }

    const { hostname, origin } = new URL(port.sender.url);
    if (!(await this.fido2ClientService.isFido2FeatureEnabled(hostname, origin))) {
      port.disconnect();
      return;
    }

    this.fido2ContentScriptPortsSet.add(port);
    port.onDisconnect.addListener(this.handleInjectScriptPortOnDisconnect);
  };

  private handleInjectScriptPortOnDisconnect = (port: chrome.runtime.Port) => {
    if (port.name !== Fido2Port.InjectedScript) {
      return;
    }

    this.fido2ContentScriptPortsSet.delete(port);
  };
}
