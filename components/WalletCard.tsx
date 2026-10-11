"use client";

import { useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";

export function WalletCard() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const [copied, setCopied] = useState(false);

  // Only the Privy embedded wallet. Not an external wallet like MetaMask.
  const wallet = wallets.find((w) => w.walletClientType === "privy");

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
      </dl>

      <p className="muted small">
        Balance, smart wallet status and transactions come in the next step.
      </p>
    </section>
  );
}
