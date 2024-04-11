import { CryptoService } from "../../platform/abstractions/crypto.service";
import { EncryptService } from "../../platform/abstractions/encrypt.service";
import { I18nService } from "../../platform/abstractions/i18n.service";
import { OrgKey } from "../../types/key";
import {
  GeneratedKeys,
  BillingKeyGenerationServiceAbstraction,
} from "../abstractions/billing-key-generation-service.abstraction";

export class BillingKeyGenerationService implements BillingKeyGenerationServiceAbstraction {
  constructor(
    private cryptoService: CryptoService,
    private encryptService: EncryptService,
    private i18nService: I18nService,
  ) {}

  async generateClientOrganizationKeys(providerId: string): Promise<GeneratedKeys> {
    const organizationKey = (await this.cryptoService.makeOrgKey<OrgKey>())[1];

    const [publicKey, encryptedPrivateKey] = await this.cryptoService.makeKeyPair(organizationKey);

    const encryptedCollectionName = await this.encryptService.encrypt(
      this.i18nService.t("defaultCollection"),
      organizationKey,
    );

    const providerKey = await this.cryptoService.getProviderKey(providerId);

    const encryptedProviderKey = await this.encryptService.encrypt(
      organizationKey.key,
      providerKey,
    );

    return {
      encryptedKey: encryptedProviderKey,
      publicKey,
      encryptedPrivateKey,
      encryptedCollectionName,
    };
  }

  async generateOrganizationKeys(): Promise<GeneratedKeys> {
    const [encryptedOrganizationKey, organizationKey] =
      await this.cryptoService.makeOrgKey<OrgKey>();

    const [publicKey, encryptedPrivateKey] = await this.cryptoService.makeKeyPair(organizationKey);

    const encryptedCollectionName = await this.encryptService.encrypt(
      this.i18nService.t("defaultCollection"),
      organizationKey,
    );

    return {
      encryptedKey: encryptedOrganizationKey,
      publicKey,
      encryptedPrivateKey,
      encryptedCollectionName,
    };
  }
}
