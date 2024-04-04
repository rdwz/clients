export enum FeatureFlag {
  BrowserFilelessImport = "browser-fileless-import",
  ItemShare = "item-share",
  FlexibleCollectionsV1 = "flexible-collections-v-1", // v-1 is intentional
  VaultOnboarding = "vault-onboarding",
  GeneratorToolsModernization = "generator-tools-modernization",
  KeyRotationImprovements = "key-rotation-improvements",
  FlexibleCollectionsMigration = "flexible-collections-migration",
  ShowPaymentMethodWarningBanners = "show-payment-method-warning-banners",
  EnableConsolidatedBilling = "enable-consolidated-billing",
  AC1795_UpdatedSubscriptionStatusSection = "AC-1795_updated-subscription-status-section",
}

// Map of feature flags to their value type. `string`, `number` and `boolean` are the only supported types.
export const FeatureFlagRuntimeTypes = {
  [FeatureFlag.BrowserFilelessImport]: "boolean",
  [FeatureFlag.ItemShare]: "boolean",
  [FeatureFlag.FlexibleCollectionsV1]: "boolean",
  [FeatureFlag.VaultOnboarding]: "boolean",
  [FeatureFlag.GeneratorToolsModernization]: "boolean",
  [FeatureFlag.KeyRotationImprovements]: "boolean",
  [FeatureFlag.FlexibleCollectionsMigration]: "boolean",
  [FeatureFlag.ShowPaymentMethodWarningBanners]: "boolean",
  [FeatureFlag.EnableConsolidatedBilling]: "boolean",
  [FeatureFlag.AC1795_UpdatedSubscriptionStatusSection]: "boolean",
} as const;

// Helpers for mapping between runtime and static types
type RuntimeType = "boolean" | "string" | "number";
type RuntimeToStatic<T extends RuntimeType> = T extends "boolean"
  ? boolean
  : T extends "string"
    ? string
    : T extends "number"
      ? number
      : never;

// Typescript type of the feature flag values
export type FeatureFlagType<Flag extends FeatureFlag> = RuntimeToStatic<
  (typeof FeatureFlagRuntimeTypes)[Flag]
>;
