import { ScriptInjectionConfig } from "../../platform/services/abstractions/script-injector.service";

type FilelessImporterInjectedScriptsConfigurations = {
  LpSuppressImportDownload: {
    mv2: ScriptInjectionConfig["mv2Details"];
    mv3: ScriptInjectionConfig["mv3Details"];
  };
};

const FilelessImporterInjectedScriptsConfig: FilelessImporterInjectedScriptsConfigurations = {
  LpSuppressImportDownload: {
    mv2: {
      file: "content/lp-suppress-import-download-script-append-mv2.js",
    },
    mv3: {
      file: "content/lp-suppress-import-download.js",
      world: "MAIN",
    },
  },
} as const;

export { FilelessImporterInjectedScriptsConfig };
