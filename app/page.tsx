import { WalletCard } from "@/components/WalletCard";

const REPO = "https://github.com/CryptoDetails/alchemy-smart-wallet-demo";

export default function Home() {
  return (
    <main className="page">
      <header className="header">
        <h1>Smart Wallet Demo</h1>
        <p>
          Sign in with email. Get a smart wallet. Send a transaction without
          paying for gas.
        </p>
      </header>

      <div className="grid">
        <WalletCard />

        <aside className="card">
          <h2>How it works</h2>
          <ol className="steps">
            <li>You sign in with your email. No seed phrase.</li>
            <li>Privy creates a normal wallet for you in the browser.</li>
            <li>
              On your first transaction, EIP-7702 turns this wallet into a smart
              wallet. The address stays the same.
            </li>
            <li>Alchemy pays the gas, based on a sponsorship policy.</li>
            <li>The Alchemy bundler sends your transaction to the network.</li>
          </ol>
        </aside>
      </div>

      <footer className="footer">
        <p>
          Network: Arbitrum Sepolia (test network, no real money). Built with
          Alchemy Wallet APIs and Privy.
        </p>
        <p>
          <a href={`${REPO}/blob/main/FRICTION_LOG.md`} target="_blank" rel="noopener noreferrer">
            Friction log
          </a>{" "}
          ·{" "}
          <a href={`${REPO}/blob/main/TROUBLESHOOTING.md`} target="_blank" rel="noopener noreferrer">
            Troubleshooting
          </a>{" "}
          ·{" "}
          <a href={REPO} target="_blank" rel="noopener noreferrer">
            Source code
          </a>
        </p>
        <p>Built by Leonid Khatskevych with Claude Code.</p>
      </footer>
    </main>
  );
}
