import { BrowserApi } from "../browser/browser-api";

import { ScriptInjectionConfig } from "./abstractions/script-injector.service";
import { BrowserScriptInjectorService } from "./browser-script-injector.service";

describe("ScriptInjectorService", () => {
  const tabId = 1;
  const combinedManifestVersionFile = "content/autofill-init.js";
  const mv2SpecificFile = "content/autofill-init-mv2.js";
  const mv2Details = { file: mv2SpecificFile };
  const mv3SpecificFile = "content/autofill-init-mv3.js";
  const mv3Details: ScriptInjectionConfig["mv3Details"] = { file: mv3SpecificFile, world: "MAIN" };
  const sharedInjectDetails: ScriptInjectionConfig["injectDetails"] = {
    runAt: "document_start",
  };
  const manifestVersionSpy = jest.spyOn(BrowserApi, "manifestVersion", "get");
  let scriptInjectorService: BrowserScriptInjectorService;
  jest.spyOn(BrowserApi, "executeScriptInTab").mockImplementation();
  jest.spyOn(BrowserApi, "isManifestVersion");

  beforeEach(() => {
    scriptInjectorService = new BrowserScriptInjectorService();
  });

  describe("inject", () => {
    describe("injection of single scripts that function in both manifest v2 and v3", () => {
      it("injects the script in manifest v2", async () => {
        manifestVersionSpy.mockReturnValue(2);

        await scriptInjectorService.inject({
          tabId,
          injectDetails: {
            file: combinedManifestVersionFile,
            frameContext: "all_frames",
            ...sharedInjectDetails,
          },
        });

        expect(BrowserApi.executeScriptInTab).toHaveBeenCalledWith(tabId, {
          ...sharedInjectDetails,
          allFrames: true,
          file: combinedManifestVersionFile,
        });
      });

      it("injects the script in manifest v3", async () => {
        manifestVersionSpy.mockReturnValue(3);

        await scriptInjectorService.inject({
          tabId,
          injectDetails: {
            file: combinedManifestVersionFile,
            frameContext: 10,
            ...sharedInjectDetails,
          },
        });

        expect(BrowserApi.executeScriptInTab).toHaveBeenCalledWith(
          tabId,
          { ...sharedInjectDetails, frameId: 10, file: combinedManifestVersionFile },
          { world: "ISOLATED" },
        );
      });
    });

    it("injects a script that is meant to function within manifest v2 only", async () => {
      manifestVersionSpy.mockReturnValue(2);

      await scriptInjectorService.inject({
        mv2Details,
        tabId,
        injectDetails: sharedInjectDetails,
      });

      expect(BrowserApi.executeScriptInTab).toHaveBeenCalledWith(tabId, {
        ...sharedInjectDetails,
        frameId: 0,
        file: mv2SpecificFile,
      });
    });

    it("injects a script that is meant to function within manifest v32 only", async () => {
      manifestVersionSpy.mockReturnValue(3);

      await scriptInjectorService.inject({
        mv3Details,
        tabId,
        injectDetails: sharedInjectDetails,
      });

      expect(BrowserApi.executeScriptInTab).toHaveBeenCalledWith(
        tabId,
        { ...sharedInjectDetails, frameId: 0, file: mv3SpecificFile },
        { world: "MAIN" },
      );
    });
  });
});
