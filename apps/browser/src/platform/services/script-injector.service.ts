import { BrowserApi } from "../browser/browser-api";

import { ScriptInjectionConfig } from "./abstractions/script-injector.service";

export class ScriptInjectorService {
  static async inject(config: ScriptInjectionConfig): Promise<void> {
    const { tabId, injectDetails, combinedManifestVersionDetails, mv2Details, mv3Details } = config;

    if (BrowserApi.isManifestVersion(3)) {
      await BrowserApi.executeScriptInTab(
        tabId,
        { ...injectDetails, file: mv3Details?.file || combinedManifestVersionDetails?.file },
        { world: mv3Details?.world || "ISOLATED" },
      );

      return;
    }

    await BrowserApi.executeScriptInTab(tabId, {
      ...injectDetails,
      file: mv2Details?.file || combinedManifestVersionDetails.file,
    });
  }
}
