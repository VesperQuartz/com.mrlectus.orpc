import { InfisicalSDK } from "@infisical/sdk";

const infisicalSdk = new InfisicalSDK({
  siteUrl: "", // Optional, defaults to https://app.infisical.com
});

export const infiClient: InfisicalSDK = await infisicalSdk.auth().universalAuth.login({
  clientId: "",
  clientSecret: "",
});
