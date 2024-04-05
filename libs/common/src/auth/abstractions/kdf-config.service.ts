import { KdfConfig } from "../models/domain/kdf-config";

export abstract class KdfConfigService {
  setKdfConfig: (KdfConfig: KdfConfig) => Promise<void>;
  getKdfConfig: () => Promise<KdfConfig>;
  validateKdfConfig: (kdfConfig: KdfConfig) => void;
}
