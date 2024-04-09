import { FakeAccountService, FakeStateProvider, mockAccountServiceWith } from "../../../spec";
import {
  ARGON2_ITERATIONS,
  ARGON2_MEMORY,
  ARGON2_PARALLELISM,
  KdfType,
  PBKDF2_ITERATIONS,
} from "../../platform/enums/kdf-type.enum";
import { Utils } from "../../platform/misc/utils";
import { UserId } from "../../types/guid";
import { KdfConfig } from "../models/domain/kdf-config";

import { KdfConfigService } from "./kdf-config.service";

describe("KdfConfigService", () => {
  let sutKdfConfigService: KdfConfigService;

  let fakeStateProvider: FakeStateProvider;
  let fakeAccountService: FakeAccountService;
  const mockUserId = Utils.newGuid() as UserId;

  beforeEach(() => {
    jest.clearAllMocks();

    fakeAccountService = mockAccountServiceWith(mockUserId);
    fakeStateProvider = new FakeStateProvider(fakeAccountService);
    sutKdfConfigService = new KdfConfigService(fakeStateProvider);
  });

  it("should set the KDF config", async () => {
    const kdfConfig: KdfConfig = {
      kdfType: KdfType.PBKDF2_SHA256,
      iterations: 600000,
    };

    await sutKdfConfigService.setKdfConfig(kdfConfig);

    await expect(sutKdfConfigService.getKdfConfig()).resolves.toEqual(kdfConfig);
  });

  it("should get the KDF config", async () => {
    const kdfConfig: KdfConfig = {
      kdfType: KdfType.Argon2id,
      iterations: 3,
      memory: 64,
      parallelism: 4,
    };

    await sutKdfConfigService.setKdfConfig(kdfConfig);

    await expect(sutKdfConfigService.getKdfConfig()).resolves.toEqual(kdfConfig);
  });

  it("should validate the PBKDF2 KDF config", () => {
    const kdfConfig: KdfConfig = {
      kdfType: KdfType.PBKDF2_SHA256,
      iterations: 600_000,
    };

    expect(() => sutKdfConfigService.validateKdfConfig(kdfConfig)).not.toThrow();
  });

  it("should validate the Argon2id KDF config", () => {
    const kdfConfig: KdfConfig = {
      kdfType: KdfType.Argon2id,
      iterations: 3,
      memory: 64,
      parallelism: 4,
    };

    expect(() => sutKdfConfigService.validateKdfConfig(kdfConfig)).not.toThrow();
  });

  it("should throw an error for invalid PBKDF2 iterations", () => {
    const kdfConfig: KdfConfig = {
      kdfType: KdfType.PBKDF2_SHA256,
      iterations: 100,
    };

    expect(() => sutKdfConfigService.validateKdfConfig(kdfConfig)).toThrow(
      `PBKDF2 iterations must be between ${PBKDF2_ITERATIONS.min} and ${PBKDF2_ITERATIONS.max}`,
    );
  });

  it("should throw an error for invalid Argon2 iterations", () => {
    const kdfConfig: KdfConfig = {
      kdfType: KdfType.Argon2id,
      iterations: 11,
      memory: 64,
      parallelism: 4,
    };

    expect(() => sutKdfConfigService.validateKdfConfig(kdfConfig)).toThrow(
      `Argon2 iterations must be between ${ARGON2_ITERATIONS.min} and ${ARGON2_ITERATIONS.max}`,
    );
  });

  it("should throw an error for invalid Argon2 memory", () => {
    const kdfConfig: KdfConfig = {
      kdfType: KdfType.Argon2id,
      iterations: 3,
      memory: 15,
      parallelism: 4,
    };

    expect(() => sutKdfConfigService.validateKdfConfig(kdfConfig)).toThrow(
      `Argon2 memory must be between ${ARGON2_MEMORY.min}mb and ${ARGON2_MEMORY.max}mb`,
    );
  });

  it("should throw an error for invalid Argon2 parallelism", () => {
    const kdfConfig: KdfConfig = {
      kdfType: KdfType.Argon2id,
      iterations: 3,
      memory: 64,
      parallelism: 17,
    };

    expect(() => sutKdfConfigService.validateKdfConfig(kdfConfig)).toThrow(
      `Argon2 parallelism must be between ${ARGON2_PARALLELISM.min} and ${ARGON2_PARALLELISM.max}`,
    );
  });
});
