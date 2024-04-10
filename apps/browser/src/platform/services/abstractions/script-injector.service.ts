export type ScriptInjectionConfig = {
  tabId: number;
  injectDetails: {
    allFrames?: boolean;
    frameId?: number;
    runAt?: chrome.tabs.InjectDetails["runAt"];
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
