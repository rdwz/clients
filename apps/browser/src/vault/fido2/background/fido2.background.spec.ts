import { mock, MockProxy } from "jest-mock-extended";
import { BehaviorSubject } from "rxjs";

import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import {
  AssertCredentialParams,
  CreateCredentialParams,
} from "@bitwarden/common/vault/abstractions/fido2/fido2-client.service.abstraction";
import { VaultSettingsService } from "@bitwarden/common/vault/abstractions/vault-settings/vault-settings.service";
import { Fido2ClientService } from "@bitwarden/common/vault/services/fido2/fido2-client.service";

import { createPortSpyMock } from "../../../autofill/spec/autofill-mocks";
import {
  flushPromises,
  sendExtensionRuntimeMessage,
  triggerRuntimeOnConnectEvent,
} from "../../../autofill/spec/testing-utils";
import { BrowserApi } from "../../../platform/browser/browser-api";
import { AbortManager } from "../../background/abort-manager";
import { Fido2ContentScript, Fido2ContentScriptId } from "../enums/fido2-content-script.enum";
import { Fido2PortName } from "../enums/fido2-port-name.enum";

import { Fido2ExtensionMessage } from "./abstractions/fido2.background";
import { Fido2Background } from "./fido2.background";

const sharedExecuteScriptOptions = { runAt: "document_start", allFrames: true };
const contentScriptDetails = {
  file: Fido2ContentScript.ContentScript,
  ...sharedExecuteScriptOptions,
};
const sharedRegistrationOptions = {
  matches: ["https://*/*"],
  excludeMatches: ["https://*/*.xml*"],
  ...sharedExecuteScriptOptions,
};

describe("Fido2Background", () => {
  const tabsQuerySpy: jest.SpyInstance = jest.spyOn(BrowserApi, "tabsQuery");
  const executeTabsSpy: jest.SpyInstance = jest.spyOn(BrowserApi, "executeScriptInTab");
  const isManifestVersionSpy: jest.SpyInstance = jest.spyOn(BrowserApi, "isManifestVersion");
  const focusTabSpy: jest.SpyInstance = jest.spyOn(BrowserApi, "focusTab").mockResolvedValue();
  const focusWindowSpy: jest.SpyInstance = jest
    .spyOn(BrowserApi, "focusWindow")
    .mockResolvedValue();
  let abortManagerMock!: MockProxy<AbortManager>;
  let abortController!: MockProxy<AbortController>;
  let registeredContentScripsMock!: MockProxy<browser.contentScripts.RegisteredContentScript>;
  let tabMock!: MockProxy<chrome.tabs.Tab>;
  let senderMock!: MockProxy<chrome.runtime.MessageSender>;
  let logService!: MockProxy<LogService>;
  let fido2ClientService!: MockProxy<Fido2ClientService>;
  let vaultSettingsService!: MockProxy<VaultSettingsService>;
  let enablePasskeysMock$!: BehaviorSubject<boolean>;
  let fido2Background!: Fido2Background;

  beforeEach(() => {
    tabMock = mock<chrome.tabs.Tab>({
      id: 123,
      url: "https://example.com",
      windowId: 456,
    });
    senderMock = mock<chrome.runtime.MessageSender>({ id: "1", tab: tabMock });
    logService = mock<LogService>();
    fido2ClientService = mock<Fido2ClientService>();
    vaultSettingsService = mock<VaultSettingsService>();
    enablePasskeysMock$ = new BehaviorSubject(true);
    vaultSettingsService.enablePasskeys$ = enablePasskeysMock$;
    fido2Background = new Fido2Background(logService, fido2ClientService, vaultSettingsService);
    abortManagerMock = mock<AbortManager>();
    abortController = mock<AbortController>();
    fido2Background["abortManager"] = abortManagerMock;
    registeredContentScripsMock = mock<browser.contentScripts.RegisteredContentScript>();
    fido2Background.init();
    executeTabsSpy.mockImplementation();
    abortManagerMock.runWithAbortController.mockImplementation((_requestId, runner) =>
      runner(abortController),
    );
    isManifestVersionSpy.mockImplementation((manifestVersion) => manifestVersion === 2);
  });

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe("injectFido2ContentScriptsInAllTabs", () => {
    it("does not inject any FIDO2 content scripts when no tabs have a secure url protocol", async () => {
      const insecureTab = mock<chrome.tabs.Tab>({ id: 789, url: "http://example.com" });
      tabsQuerySpy.mockResolvedValueOnce([insecureTab]);

      await fido2Background.injectFido2ContentScriptsInAllTabs();

      expect(executeTabsSpy).not.toHaveBeenCalled();
    });

    it("only injects the FIDO2 content script into tabs that contain a secure url protocol", async () => {
      const secondTabMock = mock<chrome.tabs.Tab>({ id: 456, url: "https://example.com" });
      const insecureTab = mock<chrome.tabs.Tab>({ id: 789, url: "http://example.com" });
      const noUrlTab = mock<chrome.tabs.Tab>({ id: 101, url: undefined });
      tabsQuerySpy.mockResolvedValueOnce([tabMock, secondTabMock, insecureTab, noUrlTab]);

      await fido2Background.injectFido2ContentScriptsInAllTabs();

      expect(BrowserApi.executeScriptInTab).toHaveBeenCalledWith(tabMock.id, contentScriptDetails);
      expect(BrowserApi.executeScriptInTab).toHaveBeenCalledWith(
        secondTabMock.id,
        contentScriptDetails,
      );
      expect(BrowserApi.executeScriptInTab).not.toHaveBeenCalledWith(
        insecureTab.id,
        contentScriptDetails,
      );
      expect(BrowserApi.executeScriptInTab).not.toHaveBeenCalledWith(
        noUrlTab.id,
        contentScriptDetails,
      );
    });

    describe("given manifest v2", () => {
      it("injects the page-script-mv2-append content script into the provided tab", async () => {
        tabsQuerySpy.mockResolvedValueOnce([tabMock]);

        await fido2Background.injectFido2ContentScriptsInAllTabs();

        expect(BrowserApi.executeScriptInTab).toHaveBeenCalledWith(tabMock.id, {
          file: Fido2ContentScript.PageScriptAppend,
          ...sharedExecuteScriptOptions,
        });
      });

      it("injects the fido2 content-script into the provided tab", async () => {
        tabsQuerySpy.mockResolvedValueOnce([tabMock]);

        await fido2Background.injectFido2ContentScriptsInAllTabs();

        expect(BrowserApi.executeScriptInTab).toHaveBeenCalledWith(
          tabMock.id,
          contentScriptDetails,
        );
      });
    });

    describe("given manifest v3", () => {
      beforeEach(() => {
        isManifestVersionSpy.mockImplementation((manifestVersion) => manifestVersion === 3);
      });

      it("injects the fido2 default page-script content script into the provided tab", async () => {
        tabsQuerySpy.mockResolvedValueOnce([tabMock]);

        await fido2Background.injectFido2ContentScriptsInAllTabs();

        expect(BrowserApi.executeScriptInTab).toHaveBeenCalledWith(
          tabMock.id,
          { file: Fido2ContentScript.PageScript, ...sharedExecuteScriptOptions },
          { world: "MAIN" },
        );
      });
    });
  });

  describe("handleEnablePasskeysUpdate", () => {
    let portMock!: MockProxy<chrome.runtime.Port>;

    beforeEach(() => {
      jest.spyOn(BrowserApi, "registerContentScriptsMv2");
      jest.spyOn(BrowserApi, "registerContentScriptsMv3");
      jest.spyOn(BrowserApi, "unregisterContentScriptsMv3");
      portMock = mock<chrome.runtime.Port>();
      fido2Background["fido2ContentScriptPortsSet"] = new Set<chrome.runtime.Port>([
        portMock,
        mock<chrome.runtime.Port>(),
      ]);
      tabsQuerySpy.mockResolvedValue([tabMock]);
    });

    it("does not destroy and re-inject the content scripts when triggering `handleEnablePasskeysUpdate` with an undefined currentEnablePasskeysSetting property", async () => {
      await flushPromises();

      expect(portMock.disconnect).not.toHaveBeenCalled();
      expect(executeTabsSpy).not.toHaveBeenCalled();
    });

    it("destroys the content scripts but skips re-injecting them when the enablePasskeys setting is set to `false`", async () => {
      enablePasskeysMock$.next(false);
      await flushPromises();

      expect(portMock.disconnect).toHaveBeenCalled();
      expect(executeTabsSpy).not.toHaveBeenCalled();
    });

    it("destroys and re-injects the content scripts when the enablePasskeys setting is set to `true`", async () => {
      enablePasskeysMock$.next(true);
      await flushPromises();

      expect(portMock.disconnect).toHaveBeenCalled();
      expect(executeTabsSpy).toHaveBeenCalledWith(tabMock.id, contentScriptDetails);
    });

    describe("given manifest v2", () => {
      it("registers the page-script-append-mv2.js and content-script.js content scripts when the enablePasskeys setting is set to `true`", async () => {
        isManifestVersionSpy.mockImplementation((manifestVersion) => manifestVersion === 2);

        enablePasskeysMock$.next(true);
        await flushPromises();

        expect(BrowserApi.registerContentScriptsMv2).toHaveBeenCalledWith({
          js: [
            { file: Fido2ContentScript.PageScriptAppend },
            { file: Fido2ContentScript.ContentScript },
          ],
          ...sharedRegistrationOptions,
        });
      });

      it("unregisters any existing registered content scripts when the enablePasskeys setting is set to `false`", async () => {
        isManifestVersionSpy.mockImplementation((manifestVersion) => manifestVersion === 2);
        fido2Background["registeredContentScripts"] = registeredContentScripsMock;

        enablePasskeysMock$.next(false);
        await flushPromises();

        expect(registeredContentScripsMock.unregister).toHaveBeenCalled();
        expect(BrowserApi.registerContentScriptsMv2).not.toHaveBeenCalledTimes(2);
      });
    });

    describe("given manifest v3", () => {
      it("registers the page-script.js and content-script.js content scripts when the enablePasskeys setting is set to `true`", async () => {
        isManifestVersionSpy.mockImplementation((manifestVersion) => manifestVersion === 3);

        enablePasskeysMock$.next(true);
        await flushPromises();

        expect(BrowserApi.registerContentScriptsMv3).toHaveBeenCalledWith([
          {
            id: Fido2ContentScriptId.PageScript,
            js: [Fido2ContentScript.PageScript],
            world: "MAIN",
            ...sharedRegistrationOptions,
          },
          {
            id: Fido2ContentScriptId.ContentScript,
            js: [Fido2ContentScript.ContentScript],
            ...sharedRegistrationOptions,
          },
        ]);
        expect(BrowserApi.unregisterContentScriptsMv3).not.toHaveBeenCalled();
      });

      it("unregisters the page-script.js and content-script.js content scripts when the enablePasskeys setting is set to `false`", async () => {
        isManifestVersionSpy.mockImplementation((manifestVersion) => manifestVersion === 3);

        enablePasskeysMock$.next(false);
        await flushPromises();

        expect(BrowserApi.unregisterContentScriptsMv3).toHaveBeenCalledWith({
          ids: [Fido2ContentScriptId.PageScript, Fido2ContentScriptId.ContentScript],
        });
        expect(BrowserApi.registerContentScriptsMv3).not.toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("extension message handlers", () => {
    it("ignores messages that do not have a handler associated with a command within the message", () => {
      const message = mock<Fido2ExtensionMessage>({ command: "nonexistentCommand" });

      sendExtensionRuntimeMessage(message);

      expect(abortManagerMock.abort).not.toHaveBeenCalled();
    });

    it("sends a response for rejected promises returned by a handler", async () => {
      const message = mock<Fido2ExtensionMessage>({ command: "fido2RegisterCredentialRequest" });
      const sender = mock<chrome.runtime.MessageSender>();
      const sendResponse = jest.fn();
      fido2ClientService.createCredential.mockRejectedValue(new Error("error"));

      sendExtensionRuntimeMessage(message, sender, sendResponse);
      await flushPromises();

      expect(sendResponse).toHaveBeenCalledWith({ error: { message: "error" } });
    });

    describe("fido2AbortRequest message", () => {
      it("aborts the request associated with the passed abortedRequestId", async () => {
        const message = mock<Fido2ExtensionMessage>({
          command: "fido2AbortRequest",
          abortedRequestId: "123",
        });

        sendExtensionRuntimeMessage(message);
        await flushPromises();

        expect(abortManagerMock.abort).toHaveBeenCalledWith(message.abortedRequestId);
      });
    });

    describe("fido2RegisterCredentialRequest message", () => {
      it("creates a credential within the Fido2ClientService", async () => {
        const message = mock<Fido2ExtensionMessage>({
          command: "fido2RegisterCredentialRequest",
          requestId: "123",
          data: mock<CreateCredentialParams>(),
        });

        sendExtensionRuntimeMessage(message, senderMock);
        await flushPromises();

        expect(fido2ClientService.createCredential).toHaveBeenCalledWith(
          message.data,
          tabMock,
          abortController,
        );
        expect(focusTabSpy).toHaveBeenCalledWith(tabMock.id);
        expect(focusWindowSpy).toHaveBeenCalledWith(tabMock.windowId);
      });
    });

    describe("fido2GetCredentialRequest", () => {
      it("asserts a credential within the Fido2ClientService", async () => {
        const message = mock<Fido2ExtensionMessage>({
          command: "fido2GetCredentialRequest",
          requestId: "123",
          data: mock<AssertCredentialParams>(),
        });

        sendExtensionRuntimeMessage(message, senderMock);
        await flushPromises();

        expect(fido2ClientService.assertCredential).toHaveBeenCalledWith(
          message.data,
          tabMock,
          abortController,
        );
        expect(focusTabSpy).toHaveBeenCalledWith(tabMock.id);
        expect(focusWindowSpy).toHaveBeenCalledWith(tabMock.windowId);
      });
    });
  });

  describe("handle ports onConnect", () => {
    let portMock!: MockProxy<chrome.runtime.Port>;

    beforeEach(() => {
      portMock = createPortSpyMock(Fido2PortName.InjectedScript);
      fido2ClientService.isFido2FeatureEnabled.mockResolvedValue(true);
    });

    it("ignores port connections that do not have the correct port name", async () => {
      const port = createPortSpyMock("nonexistentPort");

      triggerRuntimeOnConnectEvent(port);
      await flushPromises();

      expect(port.onDisconnect.addListener).not.toHaveBeenCalled();
    });

    it("ignores port connections that do not have a sender url", async () => {
      portMock.sender = undefined;

      triggerRuntimeOnConnectEvent(portMock);
      await flushPromises();

      expect(portMock.onDisconnect.addListener).not.toHaveBeenCalled();
    });

    it("disconnects the port connection when the Fido2 feature is not enabled", async () => {
      fido2ClientService.isFido2FeatureEnabled.mockResolvedValue(false);

      triggerRuntimeOnConnectEvent(portMock);
      await flushPromises();

      expect(portMock.disconnect).toHaveBeenCalled();
    });

    it("disconnects the port connection when the url is malformed", async () => {
      portMock.sender.url = "malformed-url";

      triggerRuntimeOnConnectEvent(portMock);
      await flushPromises();

      expect(portMock.disconnect).toHaveBeenCalled();
      expect(logService.error).toHaveBeenCalled();
    });

    it("adds the port to the fido2ContentScriptPortsSet when the Fido2 feature is enabled", async () => {
      triggerRuntimeOnConnectEvent(portMock);
      await flushPromises();

      expect(portMock.onDisconnect.addListener).toHaveBeenCalled();
    });
  });

  describe("handleInjectScriptPortOnDisconnect", () => {
    let portMock!: MockProxy<chrome.runtime.Port>;

    beforeEach(() => {
      portMock = createPortSpyMock(Fido2PortName.InjectedScript);
      fido2Background["fido2ContentScriptPortsSet"].add(portMock);
    });

    it("ignores the port disconnection if it does not have the correct name", () => {
      const port = createPortSpyMock("nonexistentPort");

      fido2Background["handleInjectScriptPortOnDisconnect"](port);

      expect(fido2Background["fido2ContentScriptPortsSet"].size).toBe(1);
    });

    it("removes the port from the fido2ContentScriptPortsSet", () => {
      fido2Background["handleInjectScriptPortOnDisconnect"](portMock);

      expect(fido2Background["fido2ContentScriptPortsSet"].size).toBe(0);
    });
  });
});
