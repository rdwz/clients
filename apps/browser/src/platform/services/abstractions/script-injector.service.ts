export type ScriptInjectionConfig = {
  tabId: number;
  injectDetails: {
    allFrames?: boolean;
    frameId?: number;
    runAt?: "document_start" | "document_end" | "document_idle";
  };
  combinedManifestVersionDetails?: {
    file: string;
  };
  mv2Details?: {
    file: string;
  };
  mv3Details?: {
    file: string;
    world?: chrome.scripting.ExecutionWorld;
  };
};
