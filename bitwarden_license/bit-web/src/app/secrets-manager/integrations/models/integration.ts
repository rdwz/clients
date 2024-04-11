/** Integration or SDK */
export type Integration = {
  name: string;
  image: string;
  linkURL: string;
  linkText: string;
  type: "integration" | "sdk";
  /**
   * Shows the "New" badge until the defined date.
   * When omitted, the badge is never shown.
   *
   * @example "2024-12-31"
   */
  newBadgeExpiration?: string;
};
