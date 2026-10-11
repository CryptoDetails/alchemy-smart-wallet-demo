"use client";

import { useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useSmartWallet } from "@/lib/useSmartWallet";
import { explorerUrl, type WalletStatus } from "@/lib/chain";
import { SendPanel } from "@/components/SendPanel";

export function WalletCard() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const [copied, setCopied] = useState(false);

  // Only the Privy embedded wallet. Not an external wallet like MetaMask.
  const wallet = wallets.find((w) => w.walletClientType === "privy");
  const { client, signerError, read, refresh } = useSmartWallet(wallet);

  if (!ready) {
    return (
      <section className="card">
        <h2>Your wallet</h2>
        <p className="muted">Loading…</p>
      </section>
    );
  }

  if (!authenticated) {
    return (
      <section className="card">
        <h2>Your wallet</h2>
        <p className="muted">
          Sign in to get a wallet. You only need an email.
        </p>
        <button className="button" onClick={() => login()}>
          Sign in with email
        </button>
      </section>
    );
  }

  async function copyAddress() {
    if (!wallet) return;
    try {
      await navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked. The address is still on the screen.
    }
  }

  return (
    <section className="card">
      <div className="row">
        <h2>Your wallet</h2>
        <button className="link-button" onClick={() => logout()}>
          Sign out
        </button>
      </div>

      <dl className="facts">
        <dt>Signed in as</dt>
        <dd>{user?.email?.address ?? "—"}</dd>

        <dt>Address</dt>
        <dd>
          {wallet ? (
            <>
              <code className="address">{wallet.address}</code>{" "}
              <button className="link-button" onClick={copyAddress}>
                {copied ? "Copied" : "Copy"}
              </button>
            </>
          ) : (
            <span className="muted">
              {walletsReady ? "Creating your wallet…" : "Loading wallet…"}
            </span>
          )}
        </dd>

        <dt>Network</dt>
        <dd>Arbitrum Sepolia (test network)</dd>

        <dt>Balance</dt>
        <dd>
          {read.state === "ready" ? (
            <>
              {formatBalance(read.balanceEth)} ETH{" "}
              <button className="link-button" onClick={() => void refresh()}>
                Refresh
              </button>
            </>
          ) : read.state === "loading" ? (
            <span className="muted">Loading…</span>
          ) : (
            <span className="error-text">Could not read the balance.</span>
          )}
        </dd>

        <dt>Smart wallet</dt>
        <dd>
          {read.state === "ready" ? (
            <StatusText status={read.status} />
          ) : (
            <span className="muted">—</span>
          )}
        </dd>

        <dt>Alchemy client</dt>
        <dd>
          {signerError ? (
            <span className="error-text">Could not get a signer from Privy.</span>
          ) : client ? (
            <span className="ok-text">Ready</span>
          ) : (
            <span className="muted">Connecting…</span>
          )}
        </dd>
      </dl>

      {wallet && (
        <p className="small">
          <a
            href={`${explorerUrl}/address/${wallet.address}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open this wallet in Arbiscan ↗
          </a>
        </p>
      )}

      <SendPanel client={client} onFinished={() => void refresh()} />
    </section>
  );
}

function formatBalance(eth: string) {
  if (eth === "0") return "0";
  const n = Number(eth);
  return n < 0.000001 ? "< 0.000001" : n.toFixed(6).replace(/\.?0+$/, "");
}

function StatusText({ status }: { status: WalletStatus }) {
  switch (status.kind) {
    case "not-activated":
      return <span>Not activated yet. It turns on with your first transaction.</span>;
    case "active":
      return <span className="ok-text">Active (EIP-7702)</span>;
    case "other-delegate":
      return (
        <span className="warn-text">
          Linked to a different smart account contract ({status.delegate.slice(0, 10)}…)
        </span>
      );
    case "contract":
      return <span className="warn-text">This address is a contract, not a wallet.</span>;
  }
}
