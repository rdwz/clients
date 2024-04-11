import {
  mv2ScriptInjectionDetails,
  mv3ScriptInjectionDetails,
} from "../../platform/services/abstractions/script-injector.service";

type FilelessImporterInjectedScriptsConfigurations = {
  LpSuppressImportDownload: {
    mv2: mv2ScriptInjectionDetails;
    mv3: mv3ScriptInjectionDetails;
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
