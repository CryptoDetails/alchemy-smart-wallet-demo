// All values here are public. They are visible in the browser.
// Protection comes from domain allowlists and gas policy limits, not from hiding them.
export const config = {
  privyAppId: process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "",
  alchemyApiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY ?? "",
  alchemyPolicyId: process.env.NEXT_PUBLIC_ALCHEMY_POLICY_ID ?? "",
};
