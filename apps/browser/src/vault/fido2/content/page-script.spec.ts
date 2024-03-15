import { mock } from "jest-mock-extended";

import {
  AssertCredentialResult,
  CreateCredentialResult,
} from "@bitwarden/common/vault/abstractions/fido2/fido2-client.service.abstraction";

import { WebauthnUtils } from "../webauthn-utils";

import { MessageType } from "./messaging/message";
import { Messenger } from "./messaging/messenger";

let messenger: Messenger;
jest.mock("./messaging/messenger", () => {
  return {
    Messenger: class extends jest.requireActual("./messaging/messenger").Messenger {
      static forDOMCommunication: any = jest.fn((window) => {
        const windowOrigin = window.location.origin;

        messenger = new Messenger({
          postMessage: (message, port) => window.postMessage(message, windowOrigin, [port]),
          addEventListener: (listener) => window.addEventListener("message", listener),
          removeEventListener: (listener) => window.removeEventListener("message", listener),
        });
        messenger.destroy = jest.fn();
        return messenger;
      });
    },
  };
});
jest.mock("../webauthn-utils");

const mockCredentialCreationOptions = mock<CredentialCreationOptions>({
  publicKey: mock<PublicKeyCredentialCreationOptions>({
    authenticatorSelection: { authenticatorAttachment: "platform" },
    excludeCredentials: [{ id: new ArrayBuffer(32), type: "public-key" }],
    pubKeyCredParams: [{ alg: -7, type: "public-key" }],
    user: { id: new ArrayBuffer(32), name: "test", displayName: "test" },
  }),
});
const mockCreateCredentialsResult = mock<CreateCredentialResult>({
  credentialId: "mock",
  clientDataJSON: "mock",
  attestationObject: "mock",
  authData: "mock",
  publicKey: "mock",
  publicKeyAlgorithm: -7,
  transports: ["internal"],
});
const mockCredentialRequestOptions = mock<CredentialRequestOptions>({
  mediation: "optional",
  publicKey: mock<PublicKeyCredentialRequestOptions>({
    allowCredentials: [{ id: new ArrayBuffer(32), type: "public-key" }],
  }),
});
const mockCredentialAssertResult = mock<AssertCredentialResult>({
  credentialId: "mock",
  clientDataJSON: "mock",
  authenticatorData: "mock",
  signature: "mock",
  userHandle: "mock",
});

describe("Fido2 page script with native WebAuthn support", () => {
  (globalThis as any).PublicKeyCredential = class PolyfillPublicKeyCredential {
    static isUserVerifyingPlatformAuthenticatorAvailable = () => Promise.resolve(false);
  };
  (globalThis as any).AuthenticatorAttestationResponse =
    class PolyfillAuthenticatorAttestationResponse {};
  (globalThis as any).AuthenticatorAssertionResponse =
    class PolyfillAuthenticatorAssertionResponse {};
  (globalThis as any).navigator.credentials = {
    create: jest.fn().mockResolvedValue({}),
    get: jest.fn().mockResolvedValue({}),
  };

  beforeAll(() => {
    require("./page-script");
  });

  afterAll(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe("creating WebAuthn credentials", () => {
    beforeEach(() => {
      messenger.request = jest.fn().mockResolvedValue({
        type: MessageType.CredentialCreationResponse,
        result: mockCreateCredentialsResult,
      });
    });

    it("creates and returns a WebAuthn credential", async () => {
      await navigator.credentials.create(mockCredentialCreationOptions);

      expect(WebauthnUtils.mapCredentialCreationOptions).toHaveBeenCalledWith(
        mockCredentialCreationOptions,
        false,
      );
      expect(WebauthnUtils.mapCredentialRegistrationResult).toHaveBeenCalledWith(
        mockCreateCredentialsResult,
      );
    });
  });

  describe("get WebAuthn credentials", () => {
    beforeEach(() => {
      messenger.request = jest.fn().mockResolvedValue({
        type: MessageType.CredentialGetResponse,
        result: mockCredentialAssertResult,
      });
    });

    it("gets and returns the WebAuthn credentials", async () => {
      await navigator.credentials.get(mockCredentialRequestOptions);

      expect(WebauthnUtils.mapCredentialRequestOptions).toHaveBeenCalledWith(
        mockCredentialRequestOptions,
        true,
      );
      expect(WebauthnUtils.mapCredentialAssertResult).toHaveBeenCalledWith(
        mockCredentialAssertResult,
      );
    });
  });
});

// TODO - Going to come back to this before setting the PR for review. Running into an issue where spied/mocked static methods are not being called as expected
describe.skip("Fido2 page script without native WebAuthn support", () => {
  beforeAll(() => {
    require("./page-script");
  });

  afterAll(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe("creating WebAuthn credentials", () => {
    beforeEach(() => {
      messenger.request = jest.fn().mockResolvedValue({
        type: MessageType.CredentialCreationResponse,
        result: mockCreateCredentialsResult,
      });
    });

    it("creates and returns a WebAuthn credential", async () => {
      await navigator.credentials.create(mockCredentialCreationOptions);

      expect(WebauthnUtils.mapCredentialCreationOptions).toHaveBeenCalledWith(
        mockCredentialCreationOptions,
        false,
      );
      expect(WebauthnUtils.mapCredentialRegistrationResult).toHaveBeenCalledWith(
        mockCreateCredentialsResult,
      );
    });
  });

  describe("get WebAuthn credentials", () => {
    beforeEach(() => {
      messenger.request = jest.fn().mockResolvedValue({
        type: MessageType.CredentialGetResponse,
        result: mockCredentialAssertResult,
      });
    });

    it("gets and returns the WebAuthn credentials", async () => {
      await navigator.credentials.get(mockCredentialRequestOptions);

      expect(WebauthnUtils.mapCredentialRequestOptions).toHaveBeenCalledWith(
        mockCredentialRequestOptions,
        true,
      );
      expect(WebauthnUtils.mapCredentialAssertResult).toHaveBeenCalledWith(
        mockCredentialAssertResult,
      );
    });
  });
});
