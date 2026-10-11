export function SetupMissing({ missing }: { missing: string[] }) {
  return (
    <main className="page">
      <section className="card">
        <h2>Setup is not finished</h2>
        <p>This site needs these settings, but they are empty:</p>
        <ul>
          {missing.map((name) => (
            <li key={name}>
              <code>{name}</code>
            </li>
          ))}
        </ul>
        <p className="muted">
          Local: add them to <code>.env.local</code> and restart. Vercel: add
          them in Settings → Environment Variables, then redeploy. See{" "}
          <code>.env.example</code>.
        </p>
      </section>
    </main>
  );
}
