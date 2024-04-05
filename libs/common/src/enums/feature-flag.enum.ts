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

export type AllowedFeatureFlagTypes = boolean | number | string;

// Helper to ensure the value is treated as a boolean.
const FALSE = false as boolean;

/**
 * Default value for feature flags.
 *
 * Flags MUST be short lived and SHALL be removed once enabled.
 */
export const DefaultFeatureFlagValue = {
  [FeatureFlag.BrowserFilelessImport]: FALSE,
  [FeatureFlag.ItemShare]: FALSE,
  [FeatureFlag.FlexibleCollectionsV1]: FALSE,
  [FeatureFlag.VaultOnboarding]: FALSE,
  [FeatureFlag.GeneratorToolsModernization]: FALSE,
  [FeatureFlag.KeyRotationImprovements]: FALSE,
  [FeatureFlag.FlexibleCollectionsMigration]: FALSE,
  [FeatureFlag.ShowPaymentMethodWarningBanners]: FALSE,
  [FeatureFlag.EnableConsolidatedBilling]: FALSE,
  [FeatureFlag.AC1795_UpdatedSubscriptionStatusSection]: FALSE,
} satisfies Record<FeatureFlag, AllowedFeatureFlagTypes>;

export type DefaultFeatureFlagValueType = typeof DefaultFeatureFlagValue;

export type FeatureFlagType<Flag extends FeatureFlag> = DefaultFeatureFlagValueType[Flag];
