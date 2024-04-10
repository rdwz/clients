/** Integration or SDK */
export type Integration = {
  name: string;
  image: string;
  linkURL: string;
  linkText: string;
  type: "integration" | "sdk";
};
