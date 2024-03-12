import {
  AssertCredentialResult,
  CreateCredentialResult,
  FallbackRequestedError,
} from "@bitwarden/common/vault/abstractions/fido2/fido2-client.service.abstraction";

import {
  InsecureAssertCredentialParams,
  InsecureCreateCredentialParams,
  MessageType,
} from "./messaging/message";
import { Messenger } from "./messaging/messenger";

(function (globalContext) {
  if (globalContext.document.contentType !== "text/html") {
    return;
  }

  const BrowserPublicKeyCredential = globalContext.PublicKeyCredential;
  const BrowserNavigatorCredentials = navigator.credentials;
  const BrowserAuthenticatorAttestationResponse = globalContext.AuthenticatorAttestationResponse;

  const browserNativeWebauthnSupport = globalContext.PublicKeyCredential != undefined;
  let browserNativeWebauthnPlatformAuthenticatorSupport = false;
  if (!browserNativeWebauthnSupport) {
    // Polyfill webauthn support
    try {
      // credentials is read-only if supported, use type-casting to force assignment
      (navigator as any).credentials = {
        async create() {
          throw new Error("Webauthn not supported in this browser.");
        },
        async get() {
          throw new Error("Webauthn not supported in this browser.");
        },
      };
      globalContext.PublicKeyCredential = class PolyfillPublicKeyCredential {
        static isUserVerifyingPlatformAuthenticatorAvailable() {
          return Promise.resolve(true);
        }
      } as any;
      globalContext.AuthenticatorAttestationResponse =
        class PolyfillAuthenticatorAttestationResponse {} as any;
    } catch {
      /* empty */
    }
  }

  if (browserNativeWebauthnSupport) {
    void BrowserPublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then(
      (available) => {
        browserNativeWebauthnPlatformAuthenticatorSupport = available;

        if (!available) {
          // Polyfill platform authenticator support
          globalContext.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable = () =>
            Promise.resolve(true);
        }
      },
    );
  }

  const browserCredentials = {
    create: navigator.credentials.create.bind(
      navigator.credentials,
    ) as typeof navigator.credentials.create,
    get: navigator.credentials.get.bind(navigator.credentials) as typeof navigator.credentials.get,
  };

  const messenger = ((window as any).messenger = Messenger.forDOMCommunication(window));
  let waitForFocusTimeout: number | NodeJS.Timeout;
  let focusListenerHandler: () => void;

  navigator.credentials.create = createWebAuthnCredential;
  navigator.credentials.get = getWebAuthnCredential;

  /**
   * Creates a new webauthn credential.
   *
   * @param options Options for creating new credentials.
   * @returns Promise that resolves to the new credential object.
   */
  async function createWebAuthnCredential(
    options?: CredentialCreationOptions,
  ): Promise<Credential> {
    if (!isWebauthnCall(options)) {
      return await browserCredentials.create(options);
    }

    const authenticatorAttachmentIsPlatform =
      options?.publicKey?.authenticatorSelection?.authenticatorAttachment === "platform";
    const fallbackSupported =
      (authenticatorAttachmentIsPlatform && browserNativeWebauthnPlatformAuthenticatorSupport) ||
      (!authenticatorAttachmentIsPlatform && browserNativeWebauthnSupport);
    try {
      const response = await messenger.request(
        {
          type: MessageType.CredentialCreationRequest,
          data: mapCredentialCreationOptions(options, fallbackSupported),
        },
        options?.signal,
      );

      if (response.type !== MessageType.CredentialCreationResponse) {
        throw new Error("Something went wrong.");
      }

      return mapCredentialRegistrationResult(response.result);
    } catch (error) {
      if (error && error.fallbackRequested && fallbackSupported) {
        await waitForFocus();
        return await browserCredentials.create(options);
      }

      throw error;
    }
  }

  /**
   * Retrieves a webauthn credential.
   *
   * @param options Options for creating new credentials.
   * @returns Promise that resolves to the new credential object.
   */
  async function getWebAuthnCredential(options?: CredentialRequestOptions): Promise<Credential> {
    if (!isWebauthnCall(options)) {
      return await browserCredentials.get(options);
    }

    const fallbackSupported = browserNativeWebauthnSupport;

    try {
      if (options?.mediation && options.mediation !== "optional") {
        throw new FallbackRequestedError();
      }

      const response = await messenger.request(
        {
          type: MessageType.CredentialGetRequest,
          data: mapCredentialRequestOptions(options, fallbackSupported),
        },
        options?.signal,
      );

      if (response.type !== MessageType.CredentialGetResponse) {
        throw new Error("Something went wrong.");
      }

      return mapCredentialAssertResult(response.result);
    } catch (error) {
      if (error && error.fallbackRequested && fallbackSupported) {
        await waitForFocus();
        return await browserCredentials.get(options);
      }

      throw error;
    }
  }

  function isWebauthnCall(options?: CredentialCreationOptions | CredentialRequestOptions) {
    return options && "publicKey" in options;
  }

  /**
   * Wait for window to be focused.
   * Safari doesn't allow scripts to trigger webauthn when window is not focused.
   *
   * @param fallbackWait How long to wait when the script is not able to add event listeners to `window.top`. Defaults to 500ms.
   * @param timeout Maximum time to wait for focus in milliseconds. Defaults to 5 minutes.
   * @returns Promise that resolves when window is focused, or rejects if timeout is reached.
   */
  async function waitForFocus(fallbackWait = 500, timeout = 5 * 60 * 1000) {
    try {
      if (globalContext.top.document.hasFocus()) {
        return;
      }
    } catch {
      // Cannot access window.top due to cross-origin frame, fallback to waiting
      return await new Promise((resolve) => globalContext.setTimeout(resolve, fallbackWait));
    }

    const focusPromise = new Promise<void>((resolve) => {
      focusListenerHandler = () => resolve();
      globalContext.top.addEventListener("focus", focusListenerHandler);
    });

    const timeoutPromise = new Promise<void>((_, reject) => {
      waitForFocusTimeout = globalContext.setTimeout(
        () =>
          reject(
            new DOMException("The operation either timed out or was not allowed.", "AbortError"),
          ),
        timeout,
      );
    });

    try {
      await Promise.race([focusPromise, timeoutPromise]);
    } finally {
      clearWaitForFocus();
    }
  }

  function clearWaitForFocus() {
    globalContext.top.removeEventListener("focus", focusListenerHandler);
    if (waitForFocusTimeout) {
      globalContext.clearTimeout(waitForFocusTimeout);
    }
  }

  function destroy() {
    try {
      if (browserNativeWebauthnSupport) {
        navigator.credentials.create = browserCredentials.create;
        navigator.credentials.get = browserCredentials.get;
      } else {
        (navigator as any).credentials = BrowserNavigatorCredentials;
        globalContext.PublicKeyCredential = BrowserPublicKeyCredential;
        globalContext.AuthenticatorAttestationResponse = BrowserAuthenticatorAttestationResponse;
      }

      clearWaitForFocus();
      void messenger.destroy();
    } catch (e) {
      /** empty */
    }
  }

  /**
   * Sets up a listener to handle cleanup or reconnection when the extension's
   * context changes due to being reloaded or unloaded.
   */
  messenger.handler = (message) => {
    const type = message.type;

    // Handle cleanup for disconnect request
    if (type === MessageType.DisconnectRequest) {
      destroy();
    }
  };

  function mapCredentialRequestOptions(
    options: CredentialRequestOptions,
    fallbackSupported: boolean,
  ): InsecureAssertCredentialParams {
    const keyOptions = options.publicKey;

    if (keyOptions == undefined) {
      throw new Error("Public-key options not found");
    }

    return {
      allowedCredentialIds: keyOptions.allowCredentials?.map((c) => bufferToString(c.id)) ?? [],
      challenge: bufferToString(keyOptions.challenge),
      rpId: keyOptions.rpId,
      userVerification: keyOptions.userVerification,
      timeout: keyOptions.timeout,
      fallbackSupported,
    };
  }

  function mapCredentialAssertResult(result: AssertCredentialResult): PublicKeyCredential {
    const credential = {
      id: result.credentialId,
      rawId: stringToBuffer(result.credentialId),
      type: "public-key",
      response: {
        authenticatorData: stringToBuffer(result.authenticatorData),
        clientDataJSON: stringToBuffer(result.clientDataJSON),
        signature: stringToBuffer(result.signature),
        userHandle: stringToBuffer(result.userHandle),
      } as AuthenticatorAssertionResponse,
      getClientExtensionResults: () => ({}),
      authenticatorAttachment: "platform",
    } as PublicKeyCredential;

    // Modify prototype chains to fix `instanceof` calls.
    // This makes these objects indistinguishable from the native classes.
    // Unfortunately PublicKeyCredential does not have a javascript constructor so `extends` does not work here.
    Object.setPrototypeOf(credential.response, AuthenticatorAssertionResponse.prototype);
    Object.setPrototypeOf(credential, PublicKeyCredential.prototype);

    return credential;
  }

  function mapCredentialCreationOptions(
    options: CredentialCreationOptions,
    fallbackSupported: boolean,
  ): InsecureCreateCredentialParams {
    const keyOptions = options.publicKey;

    if (keyOptions == undefined) {
      throw new Error("Public-key options not found");
    }

    return {
      attestation: keyOptions.attestation,
      authenticatorSelection: {
        requireResidentKey: keyOptions.authenticatorSelection?.requireResidentKey,
        residentKey: keyOptions.authenticatorSelection?.residentKey,
        userVerification: keyOptions.authenticatorSelection?.userVerification,
      },
      challenge: bufferToString(keyOptions.challenge),
      excludeCredentials: keyOptions.excludeCredentials?.map((credential) => ({
        id: bufferToString(credential.id),
        transports: credential.transports,
        type: credential.type,
      })),
      extensions: {
        credProps: keyOptions.extensions?.credProps,
      },
      pubKeyCredParams: keyOptions.pubKeyCredParams.map((params) => ({
        alg: params.alg,
        type: params.type,
      })),
      rp: {
        id: keyOptions.rp.id,
        name: keyOptions.rp.name,
      },
      user: {
        id: bufferToString(keyOptions.user.id),
        displayName: keyOptions.user.displayName,
        name: keyOptions.user.name,
      },
      timeout: keyOptions.timeout,
      fallbackSupported,
    };
  }

  function mapCredentialRegistrationResult(result: CreateCredentialResult): PublicKeyCredential {
    const credential = {
      id: result.credentialId,
      rawId: stringToBuffer(result.credentialId),
      type: "public-key",
      authenticatorAttachment: "platform",
      response: {
        clientDataJSON: stringToBuffer(result.clientDataJSON),
        attestationObject: stringToBuffer(result.attestationObject),

        getAuthenticatorData(): ArrayBuffer {
          return stringToBuffer(result.authData);
        },

        getPublicKey(): ArrayBuffer {
          return stringToBuffer(result.publicKey);
        },

        getPublicKeyAlgorithm(): number {
          return result.publicKeyAlgorithm;
        },

        getTransports(): string[] {
          return result.transports;
        },
      } as AuthenticatorAttestationResponse,
      getClientExtensionResults: () => ({
        credProps: result.extensions.credProps,
      }),
    } as PublicKeyCredential;

    // Modify prototype chains to fix `instanceof` calls.
    // This makes these objects indistinguishable from the native classes.
    // Unfortunately PublicKeyCredential does not have a javascript constructor so `extends` does not work here.
    Object.setPrototypeOf(credential.response, AuthenticatorAttestationResponse.prototype);
    Object.setPrototypeOf(credential, PublicKeyCredential.prototype);

    return credential;
  }

  function bufferToString(bufferSource: BufferSource): string {
    const buffer = bufferSourceToUint8Array(bufferSource);

    return fromBufferToUrlB64(buffer);
  }

  function stringToBuffer(str: string): Uint8Array {
    return fromUrlB64ToArray(str);
  }

  function fromBufferToUrlB64(buffer: ArrayBuffer): string {
    return fromB64toUrlB64(fromBufferToB64(buffer));
  }

  function fromUrlB64ToArray(str: string): Uint8Array {
    return fromB64ToArray(fromUrlB64ToB64(str));
  }

  function fromB64toUrlB64(b64Str: string) {
    return b64Str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  }

  function fromBufferToB64(buffer: ArrayBuffer): string {
    if (buffer == null) {
      return null;
    }

    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return globalThis.btoa(binary);
  }

  function fromUrlB64ToB64(urlB64Str: string): string {
    let output = urlB64Str.replace(/-/g, "+").replace(/_/g, "/");
    switch (output.length % 4) {
      case 0:
        break;
      case 2:
        output += "==";
        break;
      case 3:
        output += "=";
        break;
      default:
        throw new Error("Illegal base64url string!");
    }

    return output;
  }

  function fromB64ToArray(str: string): Uint8Array {
    if (str == null) {
      return null;
    }

    const binaryString = globalThis.atob(str);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  function bufferSourceToUint8Array(bufferSource: BufferSource) {
    if (isArrayBuffer(bufferSource)) {
      return new Uint8Array(bufferSource);
    } else {
      return new Uint8Array(bufferSource.buffer);
    }
  }

  function isArrayBuffer(bufferSource: BufferSource): bufferSource is ArrayBuffer {
    return bufferSource instanceof ArrayBuffer || bufferSource.buffer === undefined;
  }
})(globalThis);
