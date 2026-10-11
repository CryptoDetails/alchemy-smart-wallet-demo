import { createPublicClient, http, type Address, type Hex } from "viem";
import { arbitrumSepolia } from "viem/chains";
import { config } from "@/lib/config";

export const chain = arbitrumSepolia;
export const explorerUrl = "https://sepolia.arbiscan.io";

// Read-only client for balance and account code. Uses the same Alchemy key.
export const publicClient = createPublicClient({
  chain,
  transport: http(`https://arb-sepolia.g.alchemy.com/v2/${config.alchemyApiKey}`),
});

// Smart account contracts that Alchemy Wallet APIs delegate to with EIP-7702.
// Source: https://www.alchemy.com/docs/wallets/transactions/using-eip-7702
const ALCHEMY_7702_DELEGATES = [
  "0x77021100bd87b7008e5e1989d0eb38555d0d0000", // Modular Account v2 v1.1.0 (default)
  "0x69007702764179f14f51cdce752f4f775d74e139", // Modular Account v2 v1.0.0
];

export type WalletStatus =
  | { kind: "not-activated" }
  | { kind: "active"; delegate: Address }
  | { kind: "other-delegate"; delegate: Address }
  | { kind: "contract" };

// An EIP-7702 account has code "0xef0100" + 20-byte delegate address.
export function parseWalletStatus(code: Hex | undefined): WalletStatus {
  if (!code || code === "0x") return { kind: "not-activated" };
  const lower = code.toLowerCase();
  if (lower.startsWith("0xef0100") && lower.length === 48) {
    const delegate = `0x${lower.slice(8)}` as Address;
    return ALCHEMY_7702_DELEGATES.includes(delegate)
      ? { kind: "active", delegate }
      : { kind: "other-delegate", delegate };
  }
  return { kind: "contract" };
}
