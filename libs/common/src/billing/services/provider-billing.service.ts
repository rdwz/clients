import { ApiService } from "../../abstractions/api.service";
import { OrganizationKeysRequest } from "../../admin-console/models/request/organization-keys.request";
import { SyncService } from "../../vault/abstractions/sync/sync.service.abstraction";
import { BillingApiServiceAbstraction } from "../abstractions/billilng-api.service.abstraction";
import { BillingKeyGenerationServiceAbstraction } from "../abstractions/billing-key-generation-service.abstraction";
import { ProviderBillingServiceAbstraction } from "../abstractions/provider-billing.service.abstraction";
import { PlanType } from "../enums";
import { CreateClientOrganizationRequest } from "../models/request/create-client-organization.request";

export class ProviderBillingService implements ProviderBillingServiceAbstraction {
  constructor(
    private apiService: ApiService,
    private billingApiService: BillingApiServiceAbstraction,
    private billingKeyGenerationService: BillingKeyGenerationServiceAbstraction,
    private syncService: SyncService,
  ) {}

  async createClientOrganization(
    providerId: string,
    name: string,
    ownerEmail: string,
    planType: PlanType,
    seats: number,
  ): Promise<void> {
    const request = new CreateClientOrganizationRequest();
    const keys = await this.billingKeyGenerationService.generateClientOrganizationKeys(providerId);

    request.name = name;
    request.ownerEmail = ownerEmail;
    request.planType = planType;
    request.seats = seats;

    request.key = keys.encryptedKey.encryptedString;
    request.keyPair = new OrganizationKeysRequest(
      keys.publicKey,
      keys.encryptedPrivateKey.encryptedString,
    );
    request.collectionName = keys.encryptedCollectionName.encryptedString;

    await this.billingApiService.createClientOrganization(providerId, request);

    await this.apiService.refreshIdentityToken();

    await this.syncService.fullSync(true);
  }
}
