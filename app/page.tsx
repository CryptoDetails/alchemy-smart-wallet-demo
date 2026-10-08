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
        <section className="card">
          <h2>Your wallet</h2>
          <p className="muted">Sign in to see your wallet.</p>
          <button className="button" disabled>
            Sign in with email
          </button>
          <p className="muted" style={{ fontSize: 14, marginTop: 12 }}>
            Login is coming in the next step.
          </p>
        </section>

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
        Network: Arbitrum Sepolia (test network, no real money). Built with
        Alchemy Wallet APIs and Privy.
      </footer>
    </main>
  );
}
