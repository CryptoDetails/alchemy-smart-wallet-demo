"use client";

import { useState } from "react";
import type { SmartWalletClient } from "@alchemy/wallet-apis";
import { explorerUrl } from "@/lib/chain";
import { DEMO_TARGETS, runSponsoredCalls, type FlowResult, type Step } from "@/lib/sendFlow";

const STEPS: { id: Step; label: string }[] = [
  { id: "prepare", label: "Prepare: Alchemy builds the transaction and checks the gas policy" },
  { id: "sign", label: "Sign: your wallet signs it" },
  { id: "send", label: "Send: Alchemy's bundler sends it to the network" },
  { id: "confirm", label: "Confirm: wait for the network" },
];

type State =
  | { phase: "idle" }
  | { phase: "running"; step: Step; activatedNow: boolean }
  | { phase: "done"; result: FlowResult }
  | { phase: "error"; step: Step; message: string };

export function SendPanel({
  client,
  onFinished,
}: {
  client: SmartWalletClient | undefined;
  onFinished: () => void;
}) {
  const [state, setState] = useState<State>({ phase: "idle" });
  const busy = state.phase === "running";

  async function send() {
    if (!client) return;
    let current: Step = "prepare";
    setState({ phase: "running", step: "prepare", activatedNow: false });
    try {
      const result = await runSponsoredCalls(
        client,
        [{ to: DEMO_TARGETS.dead, value: BigInt(0), data: "0x" }],
        (step, info) => {
          current = step;
          setState({ phase: "running", step, activatedNow: info?.activatedNow ?? false });
        },
      );
      setState({ phase: "done", result });
    } catch (e: unknown) {
      // Stage 6 will turn these into clear messages. For now, show the raw text.
      console.error("[demo] sponsored transaction failed", e);
      setState({ phase: "error", step: current, message: e instanceof Error ? e.message : String(e) });
    } finally {
      onFinished();
    }
  }

  return (
    <div className="send-panel">
      <button className="button" onClick={send} disabled={!client || busy}>
        {busy ? "Sending…" : "Send sponsored transaction"}
      </button>
      <p className="muted small">
        Sends a zero-value call. No money moves. Alchemy pays the gas.
      </p>

      {state.phase !== "idle" && (
        <ol className="progress">
          {STEPS.map((s, i) => (
            <li key={s.id} className={stepClass(state, i)}>
              {s.label}
              {s.id === "sign" &&
                state.phase === "running" &&
                state.activatedNow &&
                " (2 signatures: one activates your smart wallet, one is the transaction)"}
            </li>
          ))}
        </ol>
      )}

      {state.phase === "done" && (
        <div className="result ok-box">
          <strong>Done. You paid $0 in gas.</strong>
          {state.result.activatedNow && (
            <p className="small">Your smart wallet is now active (EIP-7702). The address did not change.</p>
          )}
          {state.result.txHash ? (
            <p className="small">
              <a
                href={`${explorerUrl}/tx/${state.result.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                See the transaction in Arbiscan ↗
              </a>
            </p>
          ) : (
            <p className="small muted">Call ID: {state.result.callId}</p>
          )}
        </div>
      )}

      {state.phase === "error" && (
        <div className="result error-box">
          <strong>The transaction did not go through.</strong>
          <p className="small">Failed at step: {STEPS.find((s) => s.id === state.step)?.label}</p>
          <p className="small mono">{state.message}</p>
        </div>
      )}
    </div>
  );
}

function stepClass(state: State, index: number) {
  if (state.phase === "idle") return "step-todo";
  if (state.phase === "done") return "step-done";
  const current = STEPS.findIndex((s) => s.id === state.step);
  if (index < current) return "step-done";
  if (index > current) return "step-todo";
  return state.phase === "error" ? "step-error" : "step-active";
}
