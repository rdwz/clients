import { MockProxy, mock } from "jest-mock-extended";
import { Jsonify } from "type-fest";

import { mockEnc, mockFromJson } from "../../../../spec";
import { UriMatchType } from "../../../enums";
import { EncryptService } from "../../../platform/abstractions/encrypt.service";
import { EncString } from "../../../platform/models/domain/enc-string";
import { LoginUriData } from "../data/login-uri.data";

import { LoginUri } from "./login-uri";

describe("LoginUri", () => {
  let data: LoginUriData;

  beforeEach(() => {
    data = {
      uri: "encUri",
      uriChecksum: "encUriChecksum",
      match: UriMatchType.Domain,
    };
  });

  it("Convert from empty", () => {
    const data = new LoginUriData();
    const loginUri = new LoginUri(data);

    expect(loginUri).toEqual({
      match: null,
      uri: null,
      uriChecksum: null,
    });
  });

  it("Convert", () => {
    const loginUri = new LoginUri(data);

    expect(loginUri).toEqual({
      match: 0,
      uri: { encryptedString: "encUri", encryptionType: 0 },
      uriChecksum: { encryptedString: "encUriChecksum", encryptionType: 0 },
    });
  });

  it("toLoginUriData", () => {
    const loginUri = new LoginUri(data);
    expect(loginUri.toLoginUriData()).toEqual(data);
  });

  it("Decrypt", async () => {
    const loginUri = new LoginUri();
    loginUri.match = UriMatchType.Exact;
    loginUri.uri = mockEnc("uri");

    const view = await loginUri.decrypt(null);

    expect(view).toEqual({
      _canLaunch: null,
      _domain: null,
      _host: null,
      _hostname: null,
      _uri: "uri",
      match: 3,
    });
  });

  describe("validateChecksum", () => {
    let encryptService: MockProxy<EncryptService>;

    beforeEach(() => {
      encryptService = mock();
      global.bitwardenContainerService = {
        getEncryptService: () => encryptService,
        getCryptoService: () => null,
      };
    });

    it("returns true if checksums match", async () => {
      const loginUri = new LoginUri();
      loginUri.uriChecksum = mockEnc("checksum");
      encryptService.hash.mockResolvedValue("checksum");

      const actual = await loginUri.validateChecksum("uri", null, null);

      expect(actual).toBe(true);
      expect(encryptService.hash).toHaveBeenCalledWith("uri", "sha256");
    });

    it("returns false if checksums don't match", async () => {
      const loginUri = new LoginUri();
      loginUri.uriChecksum = mockEnc("checksum");
      encryptService.hash.mockResolvedValue("incorrect checksum");

      const actual = await loginUri.validateChecksum("uri", null, null);

      expect(actual).toBe(false);
    });
  });

  describe("fromJSON", () => {
    it("initializes nested objects", () => {
      jest.spyOn(EncString, "fromJSON").mockImplementation(mockFromJson);

      const actual = LoginUri.fromJSON({
        uri: "myUri",
        uriChecksum: "myUriChecksum",
        match: UriMatchType.Domain,
      } as Jsonify<LoginUri>);

      expect(actual).toEqual({
        uri: "myUri_fromJSON",
        uriChecksum: "myUriChecksum_fromJSON",
        match: UriMatchType.Domain,
      });
      expect(actual).toBeInstanceOf(LoginUri);
    });

    it("returns null if object is null", () => {
      expect(LoginUri.fromJSON(null)).toBeNull();
    });
  });
});
