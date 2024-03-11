import { mock } from "jest-mock-extended";
import { Observable } from "rxjs";

import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { VaultSettingsService } from "@bitwarden/common/vault/abstractions/vault-settings/vault-settings.service";
import { Fido2ClientService } from "@bitwarden/common/vault/services/fido2/fido2-client.service";

import { flushPromises } from "../../../autofill/spec/testing-utils";
import { BrowserApi } from "../../../platform/browser/browser-api";

import Fido2Background from "./fido2.background";

const sharedExecuteScriptOptions = { runAt: "document_start", allFrames: true };
const contentScriptDetails = {
  file: "content/fido2/content-script.js",
  ...sharedExecuteScriptOptions,
};

describe("Fido2Background", () => {
  const logService: LogService = mock<LogService>();
  let fido2ClientService: Fido2ClientService;
  let vaultSettingsService: VaultSettingsService;
  let fido2Background: Fido2Background;
  let tabMock: chrome.tabs.Tab;
  const tabsQuerySpy: jest.SpyInstance = jest.spyOn(BrowserApi, "tabsQuery");
  const executeTabsSpy: jest.SpyInstance = jest.spyOn(BrowserApi, "executeScriptInTab");
  const isManifestVersionSpy: jest.SpyInstance = jest.spyOn(BrowserApi, "isManifestVersion");

  beforeEach(() => {
    fido2ClientService = mock<Fido2ClientService>();
    vaultSettingsService = mock<VaultSettingsService>({
      enablePasskeys$: mock<Observable<boolean>>(),
    });
    fido2Background = new Fido2Background(logService, fido2ClientService, vaultSettingsService);
    fido2Background.init();
    tabMock = mock<chrome.tabs.Tab>({ id: 123, url: "https://example.com" });
    executeTabsSpy.mockImplementation();
  });

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe("injectFido2ContentScriptsInAllTabs", () => {
    it("skips injecting the FIDO2 content scripts into tabs that do not have a secure url protocol", async () => {
      const insecureTab = mock<chrome.tabs.Tab>({ id: 789, url: "http://example.com" });
      tabsQuerySpy.mockResolvedValueOnce([insecureTab]);

      await fido2Background.injectFido2ContentScriptsInAllTabs();

      expect(executeTabsSpy).not.toHaveBeenCalled();
    });

    it("injects the FIDO2 content scripts that contain a secure url protocol", async () => {
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
  });

  describe("injectFido2ContentScripts", () => {
    it("injects the fido2 page-script-mv2-append content script into the provided tab", async () => {
      isManifestVersionSpy.mockImplementation((manifestVersion) => manifestVersion === 2);

      await fido2Background["injectFido2ContentScripts"](tabMock);

      expect(BrowserApi.executeScriptInTab).toHaveBeenCalledWith(tabMock.id, {
        file: "content/fido2/page-script-append-mv2.js",
        ...sharedExecuteScriptOptions,
      });
    });

    it("injects the fido2 default page-script content script into the provided tab", async () => {
      isManifestVersionSpy.mockImplementation((manifestVersion) => manifestVersion === 3);

      await fido2Background["injectFido2ContentScripts"](tabMock);

      expect(BrowserApi.executeScriptInTab).toHaveBeenCalledWith(
        tabMock.id,
        { file: "content/fido2/page-script.js", ...sharedExecuteScriptOptions },
        { world: "MAIN" },
      );
    });

    it("injects the fido2 content-script into the provided tab", async () => {
      fido2ClientService.isFido2FeatureEnabled = jest.fn().mockResolvedValue(true);

      await fido2Background["injectFido2ContentScripts"](tabMock);

      expect(BrowserApi.executeScriptInTab).toHaveBeenCalledWith(tabMock.id, contentScriptDetails);
    });
  });

  describe("handleEnablePasskeysUpdate", () => {
    const portMock: chrome.runtime.Port = mock<chrome.runtime.Port>();

    beforeEach(() => {
      fido2Background["fido2ContentScriptPortsSet"] = new Set<chrome.runtime.Port>([
        portMock,
        mock<chrome.runtime.Port>(),
      ]);
      tabsQuerySpy.mockResolvedValue([tabMock]);
    });

    it("skips destroying and re-injecting the content scripts if the enablePasskeys setting is first being read", async () => {
      fido2Background["handleEnablePasskeysUpdate"](true);
      await flushPromises();

      expect(fido2Background["fido2ContentScriptPortsSet"].size).toBe(2);
      expect(executeTabsSpy).not.toHaveBeenCalled();
    });

    it("destroys the content scripts but skips re-injecting them if the enablePasskeys setting is set to `false`", () => {
      fido2Background["currentEnablePasskeysSetting"] = true;

      fido2Background["handleEnablePasskeysUpdate"](false);

      expect(portMock.disconnect).toHaveBeenCalled();
      expect(fido2Background["fido2ContentScriptPortsSet"].size).toBe(0);
      expect(executeTabsSpy).not.toHaveBeenCalled();
    });

    it("destroys and re-injects the content scripts if the enablePasskeys setting is set to `true`", async () => {
      fido2Background["currentEnablePasskeysSetting"] = false;

      fido2Background["handleEnablePasskeysUpdate"](true);
      await flushPromises();

      expect(portMock.disconnect).toHaveBeenCalled();
      expect(fido2Background["fido2ContentScriptPortsSet"].size).toBe(0);
      expect(executeTabsSpy).toHaveBeenCalledWith(tabMock.id, contentScriptDetails);
    });
  });
});
