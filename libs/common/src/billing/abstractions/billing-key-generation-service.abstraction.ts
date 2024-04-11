import { EncString } from "../../platform/models/domain/enc-string";

export type GeneratedKeys = {
  encryptedKey: EncString;
  publicKey: string;
  encryptedPrivateKey: EncString;
  encryptedCollectionName: EncString;
};

export abstract class BillingKeyGenerationServiceAbstraction {
  generateClientOrganizationKeys: (providerId: string) => Promise<GeneratedKeys>;
  generateOrganizationKeys: () => Promise<GeneratedKeys>;
}
