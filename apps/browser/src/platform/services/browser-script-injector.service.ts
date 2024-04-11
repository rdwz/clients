import { BrowserApi } from "../browser/browser-api";

import {
  ScriptInjectionConfig,
  ScriptInjectorService,
} from "./abstractions/browser-script-injector.service";

export class BrowserScriptInjectorService implements ScriptInjectorService {
  /**
   * Facilitates the injection of a script into a tab context. Will adjust
   * behavior between manifest v2 and v3 based on the passed configuration.
   *
   * @param config - The configuration for the script injection.
   */
  async inject(config: ScriptInjectionConfig): Promise<void> {
    const { tabId, injectDetails, mv3Details } = config;
    const file = this.getScriptFile(config);
    if (!file) {
      throw new Error("No file specified for script injection");
    }

    if (BrowserApi.isManifestVersion(3)) {
      await BrowserApi.executeScriptInTab(
        tabId,
        { ...injectDetails, file },
        { world: mv3Details?.world ?? "ISOLATED" },
      );

      return;
    }

    await BrowserApi.executeScriptInTab(tabId, {
      ...injectDetails,
      file,
    });
  }

  /**
   * Retrieves the script file to inject based on the configuration.
   *
   * @param config - The configuration for the script injection.
   */
  private getScriptFile(config: ScriptInjectionConfig): string {
    const { combinedManifestVersionDetails, mv2Details, mv3Details } = config;

    if (BrowserApi.isManifestVersion(3)) {
      return mv3Details?.file ?? combinedManifestVersionDetails?.file;
    }

    return mv2Details?.file ?? combinedManifestVersionDetails?.file;
  }
}
