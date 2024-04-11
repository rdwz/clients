import { BrowserApi } from "../browser/browser-api";

import {
  ScriptInjectionConfig,
  ScriptInjectorService as ScriptInjectorServiceInterface,
} from "./abstractions/script-injector.service";

export class ScriptInjectorService implements ScriptInjectorServiceInterface {
  /**
   * Facilitates the injection of a script into a tab context. Will adjust
   * behavior between manifest v2 and v3 based on the passed configuration.
   *
   * @param config - The configuration for the script injection.
   */
  async inject(config: ScriptInjectionConfig): Promise<void> {
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
