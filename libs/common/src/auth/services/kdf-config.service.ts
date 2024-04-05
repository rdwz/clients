import { firstValueFrom } from "rxjs";

import {
  ARGON2_ITERATIONS,
  ARGON2_MEMORY,
  ARGON2_PARALLELISM,
  KdfType,
  PBKDF2_ITERATIONS,
} from "../../platform/enums";
import {
  ActiveUserState,
  KDF_CONFIG_DISK,
  StateProvider,
  UserKeyDefinition,
} from "../../platform/state";
import { KdfConfigService as KdfConfigServiceAbstraction } from "../abstractions/kdf-config.service";
import { KdfConfig } from "../models/domain/kdf-config";

export const KDF_CONFIG = new UserKeyDefinition<KdfConfig>(KDF_CONFIG_DISK, "kdfConfig", {
  deserializer: (kdfConfig: KdfConfig) => kdfConfig,
  clearOn: [],
});

export class KdfConfigService implements KdfConfigServiceAbstraction {
  private kdfConfigState: ActiveUserState<KdfConfig>;
  constructor(private stateProvider: StateProvider) {
    this.kdfConfigState = this.stateProvider.getActive(KDF_CONFIG);
  }

  async setKdfConfig(kdfConfig: KdfConfig) {
    await this.kdfConfigState.update(() => kdfConfig);
  }

  getKdfConfig(): Promise<KdfConfig> {
    return firstValueFrom(this.kdfConfigState.state$);
  }

  /**
   * Validate that the KDF config follows the requirements for the given KDF type.
   *
   * @remarks
   * Should always be called before updating a users KDF config.
   */
  validateKdfConfig(kdfConfig: KdfConfig): void {
    switch (kdfConfig.kdfType) {
      case KdfType.PBKDF2_SHA256:
        if (!PBKDF2_ITERATIONS.inRange(kdfConfig.iterations)) {
          throw new Error(
            `PBKDF2 iterations must be between ${PBKDF2_ITERATIONS.min} and ${PBKDF2_ITERATIONS.max}`,
          );
        }
        break;
      case KdfType.Argon2id:
        if (!ARGON2_ITERATIONS.inRange(kdfConfig.iterations)) {
          throw new Error(
            `Argon2 iterations must be between ${ARGON2_ITERATIONS.min} and ${ARGON2_ITERATIONS.max}`,
          );
        }

        if (!ARGON2_MEMORY.inRange(kdfConfig.memory)) {
          throw new Error(
            `Argon2 memory must be between ${ARGON2_MEMORY.min}mb and ${ARGON2_MEMORY.max}mb`,
          );
        }

        if (!ARGON2_PARALLELISM.inRange(kdfConfig.parallelism)) {
          throw new Error(
            `Argon2 parallelism must be between ${ARGON2_PARALLELISM.min} and ${ARGON2_PARALLELISM.max}.`,
          );
        }
        break;
    }
  }
}
