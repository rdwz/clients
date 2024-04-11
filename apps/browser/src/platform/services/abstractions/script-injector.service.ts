export type Mv2ScriptInjectionDetails = {
  file: string;
};

export type Mv3ScriptInjectionDetails = {
  file: string;
  world?: chrome.scripting.ExecutionWorld; // Optional, defaults to "ISOLATED"
};

/**
 * Configuration for injecting a script into a tab. The `file` property should present as a
 * path that is relative to the root directory of the extension build, ie "content/script.js".
 */
export type ScriptInjectionConfig = {
  tabId: number;
  injectDetails: {
    file?: string; // Should only be set if the script should be called in both manifest versions. If the mv2Details or mv3Details are set, the file will be pulled from those details.
    allFrames?: boolean; // Optional, defaults to false. If set to true, the script will injection into all frames in the tab
    frameId?: number; // Optional, defaults to 0, which is the id of the top level frame in a tab
    runAt?: "document_start" | "document_end" | "document_idle"; // Optional, defaults to "document_start"
  };
  mv2Details?: Mv2ScriptInjectionDetails;
  mv3Details?: Mv3ScriptInjectionDetails;
};

export abstract class ScriptInjectorService {
  inject: (config: ScriptInjectionConfig) => Promise<void>;
}
