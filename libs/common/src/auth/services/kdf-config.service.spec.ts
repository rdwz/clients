import {
  ARGON2_ITERATIONS,
  ARGON2_MEMORY,
  ARGON2_PARALLELISM,
  KdfType,
  PBKDF2_ITERATIONS,
} from "../../platform/enums/kdf-type.enum";
import { KdfConfig } from "../models/domain/kdf-config";

import { KdfConfigService } from "./kdf-config.service";

describe("KdfConfigService", () => {
  let kdfConfigService: KdfConfigService;

  beforeEach(() => {
    kdfConfigService = new KdfConfigService(mockStateProvider);
  });

  it("should set the KDF config", async () => {
    const kdfConfig: KdfConfig = {
      kdfType: KdfType.PBKDF2_SHA256,
      iterations: 10000,
    };

    await kdfConfigService.setKdfConfig(kdfConfig);

    await expect(kdfConfigService.getKdfConfig()).resolves.toEqual(kdfConfig);
  });

  it("should get the KDF config", async () => {
    const kdfConfig: KdfConfig = {
      kdfType: KdfType.Argon2id,
      iterations: 50000,
      memory: 256,
      parallelism: 4,
    };

    await kdfConfigService.setKdfConfig(kdfConfig);

    await expect(kdfConfigService.getKdfConfig()).resolves.toEqual(kdfConfig);
  });

  it("should validate the PBKDF2 KDF config", () => {
    const kdfConfig: KdfConfig = {
      kdfType: KdfType.PBKDF2_SHA256,
      iterations: 5000,
    };

    expect(() => kdfConfigService.validateKdfConfig(kdfConfig)).not.toThrow();
  });

  it("should validate the Argon2id KDF config", () => {
    const kdfConfig: KdfConfig = {
      kdfType: KdfType.Argon2id,
      iterations: 100000,
      memory: 512,
      parallelism: 8,
    };

    expect(() => kdfConfigService.validateKdfConfig(kdfConfig)).not.toThrow();
  });

  it("should throw an error for invalid PBKDF2 iterations", () => {
    const kdfConfig: KdfConfig = {
      kdfType: KdfType.PBKDF2_SHA256,
      iterations: 100,
    };

    expect(() => kdfConfigService.validateKdfConfig(kdfConfig)).toThrowError(
      `PBKDF2 iterations must be between ${PBKDF2_ITERATIONS.min} and ${PBKDF2_ITERATIONS.max}`,
    );
  });

  it("should throw an error for invalid Argon2 iterations", () => {
    const kdfConfig: KdfConfig = {
      kdfType: KdfType.Argon2id,
      iterations: 1000,
      memory: 256,
      parallelism: 4,
    };

    expect(() => kdfConfigService.validateKdfConfig(kdfConfig)).toThrowError(
      `Argon2 iterations must be between ${ARGON2_ITERATIONS.min} and ${ARGON2_ITERATIONS.max}`,
    );
  });

  it("should throw an error for invalid Argon2 memory", () => {
    const kdfConfig: KdfConfig = {
      kdfType: KdfType.Argon2id,
      iterations: 50000,
      memory: 128,
      parallelism: 4,
    };

    expect(() => kdfConfigService.validateKdfConfig(kdfConfig)).toThrowError(
      `Argon2 memory must be between ${ARGON2_MEMORY.min}mb and ${ARGON2_MEMORY.max}mb`,
    );
  });

  it("should throw an error for invalid Argon2 parallelism", () => {
    const kdfConfig: KdfConfig = {
      kdfType: KdfType.Argon2id,
      iterations: 50000,
      memory: 256,
      parallelism: 2,
    };

    expect(() => kdfConfigService.validateKdfConfig(kdfConfig)).toThrowError(
      `Argon2 parallelism must be between ${ARGON2_PARALLELISM.min} and ${ARGON2_PARALLELISM.max}`,
    );
  });
});
