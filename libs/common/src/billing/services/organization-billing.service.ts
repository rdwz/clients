import { ApiService } from "../../abstractions/api.service";
import { OrganizationApiServiceAbstraction as OrganizationApiService } from "../../admin-console/abstractions/organization/organization-api.service.abstraction";
import { OrganizationCreateRequest } from "../../admin-console/models/request/organization-create.request";
import { OrganizationKeysRequest } from "../../admin-console/models/request/organization-keys.request";
import { OrganizationResponse } from "../../admin-console/models/response/organization.response";
import { SyncService } from "../../vault/abstractions/sync/sync.service.abstraction";
import {
  BillingKeyGenerationServiceAbstraction,
  GeneratedKeys,
} from "../abstractions/billing-key-generation-service.abstraction";
import {
  OrganizationBillingServiceAbstraction,
  OrganizationInformation,
  PaymentInformation,
  PlanInformation,
  SubscriptionInformation,
} from "../abstractions/organization-billing.service";
import { PlanType } from "../enums";

export class OrganizationBillingService implements OrganizationBillingServiceAbstraction {
  constructor(
    private billingKeyGenerationService: BillingKeyGenerationServiceAbstraction,
    private apiService: ApiService,
    private organizationApiService: OrganizationApiService,
    private syncService: SyncService,
  ) {}

  async purchaseSubscription(subscription: SubscriptionInformation): Promise<OrganizationResponse> {
    const request = new OrganizationCreateRequest();

    const organizationKeys = await this.billingKeyGenerationService.generateOrganizationKeys();

    this.setOrganizationKeys(request, organizationKeys);

    this.setOrganizationInformation(request, subscription.organization);

    this.setPlanInformation(request, subscription.plan);

    this.setPaymentInformation(request, subscription.payment);

    return await this.createOrganization(request);
  }

  async startFree(subscription: SubscriptionInformation): Promise<OrganizationResponse> {
    const request = new OrganizationCreateRequest();

    const organizationKeys = await this.billingKeyGenerationService.generateOrganizationKeys();

    this.setOrganizationKeys(request, organizationKeys);

    this.setOrganizationInformation(request, subscription.organization);

    this.setPlanInformation(request, subscription.plan);

    return await this.createOrganization(request);
  }

  private async createOrganization(request: OrganizationCreateRequest) {
    const response = await this.organizationApiService.create(request);

    await this.apiService.refreshIdentityToken();

    await this.syncService.fullSync(true);

    return response;
  }

  private prohibitsAdditionalSeats(planType: PlanType) {
    switch (planType) {
      case PlanType.Free:
      case PlanType.FamiliesAnnually:
      case PlanType.FamiliesAnnually2019:
      case PlanType.TeamsStarter2023:
      case PlanType.TeamsStarter:
        return true;
      default:
        return false;
    }
  }

  private setOrganizationInformation(
    request: OrganizationCreateRequest,
    information: OrganizationInformation,
  ): void {
    request.name = information.name;
    request.businessName = information.businessName;
    request.billingEmail = information.billingEmail;
    request.initiationPath = information.initiationPath;
  }

  private setOrganizationKeys(request: OrganizationCreateRequest, keys: GeneratedKeys): void {
    request.key = keys.encryptedKey.encryptedString;
    request.keys = new OrganizationKeysRequest(
      keys.publicKey,
      keys.encryptedPrivateKey.encryptedString,
    );
    request.collectionName = keys.encryptedCollectionName.encryptedString;
  }

  private setPaymentInformation(
    request: OrganizationCreateRequest,
    information: PaymentInformation,
  ) {
    const [paymentToken, paymentMethodType] = information.paymentMethod;
    request.paymentToken = paymentToken;
    request.paymentMethodType = paymentMethodType;

    const billingInformation = information.billing;
    request.billingAddressPostalCode = billingInformation.postalCode;
    request.billingAddressCountry = billingInformation.country;

    if (billingInformation.taxId) {
      request.taxIdNumber = billingInformation.taxId;
      request.billingAddressLine1 = billingInformation.addressLine1;
      request.billingAddressLine2 = billingInformation.addressLine2;
      request.billingAddressCity = billingInformation.city;
      request.billingAddressState = billingInformation.state;
    }
  }

  private setPlanInformation(
    request: OrganizationCreateRequest,
    information: PlanInformation,
  ): void {
    request.planType = information.type;

    if (this.prohibitsAdditionalSeats(request.planType)) {
      request.useSecretsManager = information.subscribeToSecretsManager;
      request.isFromSecretsManagerTrial = information.isFromSecretsManagerTrial;
      return;
    }

    request.additionalSeats = information.passwordManagerSeats;

    if (information.subscribeToSecretsManager) {
      request.useSecretsManager = true;
      request.isFromSecretsManagerTrial = information.isFromSecretsManagerTrial;
      request.additionalSmSeats = information.secretsManagerSeats;
      request.additionalServiceAccounts = information.secretsManagerServiceAccounts;
    }

    if (information.storage) {
      request.additionalStorageGb = information.storage;
    }
  }
}
