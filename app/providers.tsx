"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { arbitrumSepolia } from "viem/chains";
import { config } from "@/lib/config";
import { SetupMissing } from "@/components/SetupMissing";

export function Providers({ children }: { children: React.ReactNode }) {
  const missing = [
    !config.privyAppId && "NEXT_PUBLIC_PRIVY_APP_ID",
    !config.alchemyApiKey && "NEXT_PUBLIC_ALCHEMY_API_KEY",
    !config.alchemyPolicyId && "NEXT_PUBLIC_ALCHEMY_POLICY_ID",
  ].filter((name): name is string => Boolean(name));

  if (missing.length > 0) {
    return <SetupMissing missing={missing} />;
  }

  return (
    <PrivyProvider
      appId={config.privyAppId}
      config={{
        loginMethods: ["email"],
        defaultChain: arbitrumSepolia,
        supportedChains: [arbitrumSepolia],
        embeddedWallets: {
          ethereum: { createOnLogin: "all-users" },
          showWalletUIs: false,
        },
        appearance: { walletChainType: "ethereum-only" },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
