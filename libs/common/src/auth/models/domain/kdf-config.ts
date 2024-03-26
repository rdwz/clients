import { KdfType } from "../../../platform/enums/kdf-type.enum";

export class KdfConfig {
  iterations: number;
  kdfType: KdfType;
  memory?: number;
  parallelism?: number;

  constructor(iterations: number, kdfType: KdfType, memory?: number, parallelism?: number) {
    this.iterations = iterations;
    this.kdfType = kdfType;
    this.memory = memory;
    this.parallelism = parallelism;
  }
}
