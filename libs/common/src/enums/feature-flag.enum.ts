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

type DefaultValue = boolean | number | string;

/**
 * Default value for feature flags.
 *
 * Flags MUST be short lived and SHALL be removed once enabled.
 */
export const DefaultFeatureFlagValue = {
  [FeatureFlag.BrowserFilelessImport]: false as boolean,
  [FeatureFlag.ItemShare]: "no" as string,
  [FeatureFlag.FlexibleCollectionsV1]: false as boolean,
  [FeatureFlag.VaultOnboarding]: false as boolean,
  [FeatureFlag.GeneratorToolsModernization]: false as boolean,
  [FeatureFlag.KeyRotationImprovements]: false as boolean,
  [FeatureFlag.FlexibleCollectionsMigration]: false as boolean,
  [FeatureFlag.ShowPaymentMethodWarningBanners]: false as boolean,
  [FeatureFlag.EnableConsolidatedBilling]: false as boolean,
  [FeatureFlag.AC1795_UpdatedSubscriptionStatusSection]: false as boolean,
} satisfies Record<FeatureFlag, DefaultValue>;

export type DefaultFeatureFlagValueType = typeof DefaultFeatureFlagValue;

export type FeatureFlagType<Flag extends FeatureFlag> = DefaultFeatureFlagValueType[Flag];
