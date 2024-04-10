/** Integration or SDK */
export type Integration = {
  name: string;
  image: string;
  linkURL: string;
  secondaryText: string;
  type: "integration" | "sdk";
};
