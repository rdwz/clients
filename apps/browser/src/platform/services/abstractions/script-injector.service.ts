export type CombinedManifestVersionInjectionDetails = {
  file: string; // The path to the script file to inject, relative to the root directory of the extension build
};

export type Mv2ScriptInjectionDetails = CombinedManifestVersionInjectionDetails;

export type Mv3ScriptInjectionDetails = CombinedManifestVersionInjectionDetails & {
  world?: chrome.scripting.ExecutionWorld;
};

export type ScriptInjectionConfig = {
  tabId: number;
  injectDetails: {
    allFrames?: boolean; // Optional, defaults to false. If set to true, the script will injection into all frames in the tab
    frameId?: number; // Optional, defaults to 0, which is the id of the top level frame in a tab
    runAt?: "document_start" | "document_end" | "document_idle"; // Optional, defaults to "document_start"
  };
  combinedManifestVersionDetails?: CombinedManifestVersionInjectionDetails;
  mv2Details?: Mv2ScriptInjectionDetails;
  mv3Details?: Mv3ScriptInjectionDetails;
};
export abstract class ScriptInjectorService {
  inject: (config: ScriptInjectionConfig) => Promise<void>;
}
