import { PlanType } from "../enums";

export abstract class ProviderBillingServiceAbstraction {
  createClientOrganization: (
    providerId: string,
    name: string,
    ownerEmail: string,
    planType: PlanType,
    seats: number,
  ) => Promise<void>;
}
