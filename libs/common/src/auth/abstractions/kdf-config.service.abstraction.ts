import { KdfConfig } from "../models/domain/kdf-config";

export abstract class KdfConfigServiceAbstraction {
  setKdfConfig: (KdfConfig: KdfConfig) => Promise<void>;
  getKdfConfig: () => Promise<KdfConfig>;
}
