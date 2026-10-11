"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { arbitrumSepolia } from "viem/chains";
import { config } from "@/lib/config";
import { SetupMissing } from "@/components/SetupMissing";

export function Providers({ children }: { children: React.ReactNode }) {
  if (!config.privyAppId) {
    return <SetupMissing missing={["NEXT_PUBLIC_PRIVY_APP_ID"]} />;
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
