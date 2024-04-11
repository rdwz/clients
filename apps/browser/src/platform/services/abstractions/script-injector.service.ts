export type combinedManifestVersionInjectionDetails = {
  file: string;
};

export type mv2ScriptInjectionDetails = combinedManifestVersionInjectionDetails;

export type mv3ScriptInjectionDetails = combinedManifestVersionInjectionDetails & {
  world?: chrome.scripting.ExecutionWorld;
};

export type ScriptInjectionConfig = {
  tabId: number;
  injectDetails: {
    allFrames?: boolean;
    frameId?: number;
    runAt?: "document_start" | "document_end" | "document_idle";
  };
  combinedManifestVersionDetails?: combinedManifestVersionInjectionDetails;
  mv2Details?: mv2ScriptInjectionDetails;
  mv3Details?: mv3ScriptInjectionDetails;
};

export interface ScriptInjectorService {
  inject(config: ScriptInjectionConfig): Promise<void>;
}
