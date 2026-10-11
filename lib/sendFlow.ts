import type { SmartWalletClient } from "@alchemy/wallet-apis";
import type { Address, Hex } from "viem";

// Addresses we send zero-value calls to. No money moves. No contract of our own.
export const DEMO_TARGETS = {
  dead: "0x000000000000000000000000000000000000dEaD" as Address,
  zero: "0x0000000000000000000000000000000000000000" as Address,
};

export type Call = { to: Address; value: bigint; data: Hex };

export type Step = "prepare" | "sign" | "send" | "confirm";

export type FlowResult = {
  callId: string;
  txHash: Hex | undefined;
  activatedNow: boolean;
};

// Same steps as client.sendCalls(), split up so the user can see each one.
// See node_modules/@alchemy/wallet-apis/dist/esm/actions/sendCalls.js
export async function runSponsoredCalls(
  client: SmartWalletClient,
  calls: Call[],
  onStep: (step: Step, info?: { activatedNow?: boolean }) => void,
): Promise<FlowResult> {
  // 1. Alchemy builds the operation and attaches the gas policy (set on the client).
  onStep("prepare");
  let prepared = await client.prepareCalls({ calls });

  // Some policies ask the user to sign a permit first. Ours should not, but handle it like the SDK does.
  if (prepared.type === "paymaster-permit") {
    const signature = await client.signSignatureRequest(prepared.signatureRequest);
    prepared = await client.prepareCalls({
      ...prepared.modifiedRequest,
      paymasterPermitSignature: signature,
    });
  }

  // On the first transaction Alchemy returns two things to sign:
  // the EIP-7702 authorization (activates the smart wallet) and the operation itself.
  const activatedNow =
    prepared.type === "authorization" ||
    (prepared.type === "array" && prepared.data.some((item) => item.type === "authorization"));

  // 2. The Privy wallet signs. No pop-up, because wallet UIs are off.
  onStep("sign", { activatedNow });
  const signed = await client.signPreparedCalls(prepared);

  // 3. Alchemy's bundler sends it to the network. Alchemy pays the gas.
  onStep("send", { activatedNow });
  const { id } = await client.sendPreparedCalls(signed);

  // 4. Wait until the network includes it.
  onStep("confirm", { activatedNow });
  const status = await client.waitForCallsStatus({ id, timeout: 120_000 });
  if (status.status !== "success") {
    throw new CallFailedError(status.status ?? "unknown", id);
  }

  return {
    callId: id,
    txHash: status.receipts?.[0]?.transactionHash,
    activatedNow,
  };
}

export class CallFailedError extends Error {
  constructor(
    public readonly status: string,
    public readonly callId: string,
  ) {
    super(`The transaction was not successful. Status: ${status}.`);
    this.name = "CallFailedError";
  }
}
