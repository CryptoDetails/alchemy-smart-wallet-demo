"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toViemAccount, type ConnectedWallet } from "@privy-io/react-auth";
import {
  alchemyWalletTransport,
  createSmartWalletClient,
  type SmartWalletClient,
} from "@alchemy/wallet-apis";
import { formatEther, type LocalAccount } from "viem";
import { config } from "@/lib/config";
import { chain, parseWalletStatus, publicClient, type WalletStatus } from "@/lib/chain";

type ReadState =
  | { state: "loading" }
  | { state: "ready"; balanceEth: string; status: WalletStatus }
  | { state: "error"; message: string };

export function useSmartWallet(wallet: ConnectedWallet | undefined) {
  const [signer, setSigner] = useState<LocalAccount>();
  const [signerError, setSignerError] = useState<string>();
  const [read, setRead] = useState<ReadState>({ state: "loading" });

  // 1. Turn the Privy embedded wallet into a viem signer.
  useEffect(() => {
    if (!wallet) return;
    let cancelled = false;
    toViemAccount({ wallet })
      .then((account) => {
        if (!cancelled) setSigner(account as LocalAccount);
      })
      .catch((e: unknown) => {
        if (!cancelled) setSignerError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [wallet]);

  // 2. Create the Alchemy smart wallet client with this signer and our gas policy.
  const client: SmartWalletClient | undefined = useMemo(() => {
    if (!signer) return undefined;
    return createSmartWalletClient({
      signer,
      transport: alchemyWalletTransport({ apiKey: config.alchemyApiKey }),
      chain,
      paymaster: { policyId: config.alchemyPolicyId },
    });
  }, [signer]);

  // 3. Read balance and smart wallet status from the chain.
  const refresh = useCallback(async () => {
    if (!wallet) return;
    const address = wallet.address as `0x${string}`;
    setRead((prev) => (prev.state === "ready" ? prev : { state: "loading" }));
    try {
      const [balance, code] = await Promise.all([
        publicClient.getBalance({ address }),
        publicClient.getCode({ address }),
      ]);
      setRead({
        state: "ready",
        balanceEth: formatEther(balance),
        status: parseWalletStatus(code),
      });
    } catch (e: unknown) {
      setRead({ state: "error", message: e instanceof Error ? e.message : String(e) });
    }
  }, [wallet]);

  useEffect(() => {
    // Read from the chain as soon as we know the address.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  return { client, signerError, read, refresh };
}
