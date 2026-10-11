# Troubleshooting: Wallet APIs + Privy (EIP-7702, gas sponsorship)

A runbook for a support team. It covers every real problem from [FRICTION_LOG.md](./FRICTION_LOG.md), plus every error type the demo shows to users (`lib/errors.ts`).

Each section has: **Symptom** (what the developer sees), **Cause**, **Check**, **Fix**, **Docs**.

Tested with: `@alchemy/wallet-apis` 5.3.0, `@privy-io/react-auth` 3.48.1, `viem` 2.56.5, Next.js 16, Arbitrum Sepolia, a "Gas Sponsorship (BSO)" policy. October 2026.

---

## Fast triage

| The developer says… | Go to |
|---|---|
| "npm install fails with ERESOLVE about `@solana/kit`" | [A1](#a1-eresolve-about-solanakit-on-a-clean-install) |
| "Build fails: Can't resolve `@stripe/stripe-js`" | [A2](#a2-build-fails-cant-resolve-stripestripe-js) |
| "Type error: Privy signer is not assignable to the Alchemy signer" | [A3](#a3-two-copies-of-viem) |
| "Which services do I enable when I create the app?" | [B1](#b1-which-services-to-enable) |
| "Arbitrum Sepolia is not in the policy's network list" | [B2](#b2-the-network-is-missing-in-the-policy) |
| "Is 0 in the policy limits unlimited?" / "Do I need a balance?" | [B3](#b3-policy-limits-and-balance) |
| "Privy login works on localhost but not on my domain" | [B4](#b4-privy-login-fails-on-the-deployed-site) |
| "My API key is visible in the browser" | [B5](#b5-the-api-key-is-visible-in-the-browser) |
| `Sponsorship failed: Policy ID(s) not found` | [C1](#c1-policy-ids-not-found) |
| `max count per spender exceeded` and other limit errors | [C2](#c2-policy-limit-reached) |
| "The error comes after the user already signed" | [C3](#c3-policy-errors-come-after-signing) |
| `EIP-7702 authorization signing is not supported by external wallets` | [C4](#c4-the-first-transaction-fails-at-signing) |
| `precheck failed: sender balance and deposit together is…` | [C5](#c5-nobody-paid-for-the-gas) |
| "The explorer shows paymaster 0x0. Was it really sponsored?" | [D1](#d1-is-the-transaction-really-sponsored) |
| Other errors from the demo | [E](#e-all-error-types-in-the-demo) |

---

## A. Install and build

### A1. ERESOLVE about `@solana/kit` on a clean install

**Symptom.** `npm install` works the first time. Then a clean install (`npm ci`, a CI job, or a Vercel build) fails:
```
npm error code ERESOLVE
npm error While resolving: @alchemy/wallet-apis@5.3.0
npm error Found: @solana/kit@5.5.1
npm error Could not resolve dependency:
npm error peerOptional @solana/kit@">=6.0.0" from @alchemy/wallet-apis@5.3.0
```

**Cause.** `@alchemy/wallet-apis` has an optional peer `@solana/kit >=6`. `@privy-io/react-auth` and its Solana helpers (`@solana-program/*`) need `@solana/kit ^5`. npm accepts the conflict on the first install and writes an "invalid" tree into the lock file. A clean install from that lock file fails.

**Check.** Run `npm ls @solana/kit`. If you see `invalid: ">=6.0.0" from node_modules/@alchemy/wallet-apis`, this is the case.

**Fix (EVM-only apps).** Add `.npmrc` with `legacy-peer-deps=true`, delete `node_modules` and `package-lock.json`, install again. Then do A2 and A3, because this setting also stops npm from installing peer packages.
Other option: `npm install @solana/kit@^6`. It builds, but Privy's Solana helpers then run on a version they don't support. Use it only if you need Alchemy's Solana features.

**Docs.** [Privy signer guide](https://www.alchemy.com/docs/wallets/third-party/signers/privy) (does not mention this yet). Log: #6.

### A2. Build fails: Can't resolve `@stripe/stripe-js`

**Symptom.** After A1, `next build` fails:
```
Module not found: Can't resolve '@stripe/stripe-js'
./node_modules/@stripe/crypto/dist/stripe.esm.js
```

**Cause.** With `legacy-peer-deps=true`, npm does not install peer packages. Privy's on-ramp screen imports `@stripe/crypto`, which needs `@stripe/stripe-js` as a peer.

**Check.** Run `npm ls --all | grep "UNMET DEPENDENCY"`. Anything listed there (not "UNMET OPTIONAL") must be installed by hand.

**Fix.** `npm install @stripe/stripe-js@^1.46.0 @tanstack/react-query@^5`. The second one is needed by `wagmi`, which Privy brings in.

**Docs.** Log: #7.

### A3. Two copies of viem

**Symptom.** TypeScript says the Privy signer is not assignable to the Alchemy `signer` type, or signing fails at runtime with an unclear error. `npm ls viem` shows `invalid: "2.56.5" from node_modules/@privy-io/...`.

**Cause.** Privy pins `viem` to one exact version (2.56.5 in Privy 3.48). With `legacy-peer-deps`, npm may install a newer viem at the top level. Then the app has two viem copies.

**Check.** `npm ls viem`. There must be one version and no `invalid`.

**Fix.** Install the exact version Privy wants: `npm install viem@2.56.5 --save-exact`. Alchemy accepts `viem ^2.45.0`, so this works for both. Check Privy's `package.json` for the version when you upgrade Privy.

**Docs.** Log: #7.

---

## B. Dashboard setup

### B1. Which services to enable

**Symptom.** On Alchemy Dashboard → Create new app, the developer looks for "Wallet APIs" or "Smart Wallets" and does not find it.

**Cause.** "Wallet APIs" is not a card on that screen. It uses several services together.

**Fix.** Select **Node API** (balance and chain reads), **Bundler API** (sends user operations) and **Gas Manager** (sponsorship). Services can also be turned on later on the app page.

**Docs.** [Create an API key](https://www.alchemy.com/docs/create-an-api-key). Log: #10, #1.

### B2. The network is missing in the policy

**Symptom.** In Gas Sponsorship → Create policy, the network (for example Arbitrum Sepolia) is not in the list.

**Cause.** A policy can only use networks that are already enabled on its app.

**Fix.** Open the app → Enable networks → add the network. Then create the policy. Order for a new project:
1. Create the app and enable the network.
2. Turn on Node API, Bundler API, Gas Manager.
3. Gas Sponsorship → Create policy → same app → type **Gas Sponsorship** → same network.
4. Set limits, make the policy **Active**, copy the Policy ID.
5. Use the API key **of the same app**.

**Docs.** [Create sponsorship policies](https://www.alchemy.com/docs/wallets/transactions/sponsor-gas/sponsorship-policy-management). Log: #3.

### B3. Policy limits and balance

**Symptom.** "The new policy shows 0 in the limits. Is that unlimited?" / "Available balance is $0.00. Will sponsorship work?"

**Cause.** The screen does not explain these values.

**Fix.** Set every limit to an explicit number, so the meaning of 0 does not matter. On testnets, sponsorship works with a $0.00 balance (tested on Arbitrum Sepolia on the Free tier). On mainnet you need a paid plan.

**Docs.** [Sponsorship policy rules](https://www.alchemy.com/docs/wallets/transactions/sponsor-gas/conditional-sponsorship-rules). Log: #11.

### B4. Privy login fails on the deployed site

**Symptom.** Login works on `localhost` but fails, or the Privy window does not open, on the real domain.

**Cause.** The domain is not in Privy's allowed origins.

**Fix.** Privy Dashboard → App settings → Basics → **Domains and clients** tab → **Allowed origins** → add `https://your-domain` (one entry per domain, with `https://`).

**Docs.** [Privy: allowed domains](https://docs.privy.io/recipes/react/allowed-domains). Log: #8.

### B5. The API key is visible in the browser

**Symptom.** A security review flags the Alchemy key in the page's JavaScript or in network requests (it is part of the RPC URL).

**Cause.** In a browser-only app the key must be in the browser. The Alchemy examples do this without a warning.

**Fix.** Limit what a copied key can do:
1. Alchemy Dashboard → your app → **Security** → Allowlist → **Domain** → "Restrict to specific domains" → add your domain (without `https://`) and `localhost` for development.
2. Keep low limits on the gas policy (total, per wallet, per transaction).
3. For production with real money: move Alchemy calls to your server and keep the key there.

Note: with a domain allowlist, requests without an `Origin` header (curl, server scripts) are rejected. Changes can take a few minutes.

**Docs.** [How to add allowlists](https://www.alchemy.com/docs/how-to-add-allowlists-to-your-apps-for-enhanced-security). Log: #2.

---

## C. Runtime errors

### C1. Policy ID(s) not found

**Symptom.** Live response (switched-off policy, October 2026):
```
code: -32602
Sponsorship failed: Policy ID(s) not found. Please ensure you're sending requests with the API key
associated with the policies' app, that the policies are active, and the network is allowed.[<policy id>]
```
The docs list this as `-32600`, and the Gas Manager page has another text for it (`Invalid Policy ID...`). Match on text, not on the code.

**Cause.** One of: the policy is not Active; the policy belongs to another app than the API key; the policy does not cover this network; a typo in the Policy ID.

**Check.** In this order:
1. Gas Sponsorship → the policy has the green **Active** label and the switch is on.
2. The API key on the app page and the policy are in the **same** app (top-left app selector).
3. "Configured networks" in the policy includes the chain the app uses.
4. The Policy ID in the app's settings is the full ID (copy with the Copy button; the screen cuts it).

**Fix.** Fix what step 1–4 found. Wait about a minute after a dashboard change.

**Demo error type:** `policy-not-found`. **Docs.** [Wallet APIs errors](https://www.alchemy.com/docs/wallets/troubleshooting/wallet-apis-errors). Log: #13, #1.

### C2. Policy limit reached

**Symptom.** One of these texts (Gas Manager format):

| Error text | Dashboard field | Demo error type |
|---|---|---|
| `Policy's max count per spender exceeded.` | Transaction limits → Per-wallet transaction limit | `limit-per-wallet` |
| `Policy's max spend per spender exceeded.` | Spending limits → Per-wallet limit | `limit-per-wallet` |
| `Policy max count exceeded.` | Transaction limits → Total transaction limit | `limit-global` |
| `Policy max spend global exceeded.` | Spending limits → Total policy limit | `limit-global` |
| `User operation cost exceeds specified spend limit` | Spending limits → Per-transaction limit | `limit-per-tx` |
| `...over their MAX token limit for this network.` | Team balance / plan | `limit-global` |

The first row was reproduced live (per-wallet limit set to 1). Note the names: the error and the dashboard use different words.

**Cause.** The policy is doing its job.

**Check.** Gas Sponsorship → **Usage** tab shows how much was used.

**Fix.** Raise the limit, or tell the user it is expected (as the demo does).

**Docs.** [Gas Manager errors](https://www.alchemy.com/docs/wallets/reference/gas-manager-errors). Log: #13.

### C3. Policy errors come after signing

**Symptom.** "The user signed, and then the transaction failed with a policy error."

**Cause.** By design for **Gas Sponsorship (BSO)** policies: `wallet_prepareCalls` succeeds even when the policy is off or the limit is reached. The policy is checked in `wallet_sendPreparedCalls`, after the user signed. Seen live for both C1 and C2.

**Fix.** In the app, say clearly that nothing was sent and nothing was charged. Do not ask the user to sign again in a loop. If your app has a signature pop-up, consider checking limits on your own server before you start.

**Docs.** [Bundler Sponsored Operations](https://www.alchemy.com/docs/wallets/transactions/sponsor-gas/bundler-sponsored-operations). Log: #14.

### C4. The first transaction fails at signing

**Symptom.** `EIP-7702 authorization signing is not supported by external wallets` or `Current signer does not support signing authorization requests`.

**Cause.** The first transaction must sign an EIP-7702 authorization. Only the Privy **embedded** wallet can do this through `toViemAccount`. The Alchemy example takes `wallets[0]`, which can be an external wallet (MetaMask) if the app allows wallet login. MetaMask also does not sign authorizations for other contracts.

**Check.** Log `wallet.walletClientType`. It must be `"privy"`.

**Fix.** `const wallet = wallets.find((w) => w.walletClientType === "privy")`. For users who must use an external wallet, use non-7702 mode (`requestAccount`).

**Demo error type:** `signer`. **Docs.** [EIP-7702](https://www.alchemy.com/docs/wallets/transactions/using-eip-7702). Log: #9.

### C5. Nobody paid for the gas

**Symptom.** `precheck failed: sender balance and deposit together is 0 but must be at least …`

**Cause.** The request was sent without a policy ID, so the network expects the wallet to pay.

**Check.** The client has `paymaster: { policyId }`, and the environment variable is not empty in this deployment (on Vercel: set, then **Redeploy**).

**Demo error type:** `no-sponsorship`. **Docs.** [Wallet APIs errors](https://www.alchemy.com/docs/wallets/troubleshooting/wallet-apis-errors). Not reproduced live.

---

## D. Verifying results

### D1. Is the transaction really sponsored?

**Symptom.** In the explorer, the `UserOperationEvent` shows `paymaster = 0x0000…0000` and `actualGasCost = 0`.

**Cause.** With BSO there is no onchain paymaster. The bundler (the `From` address of the outer transaction) pays the fee. Example: [this batch](https://sepolia.arbiscan.io/tx/0x41a179ec94ee33584a9c83869787a8dbe46c94b4e868d2ab1b610bfaf69e3cf1#eventlog).

**Check.** Three signs of a sponsored transaction: the user's ETH balance did not change; the outer transaction's `From` is not the user; the policy's **Usage** tab shows the cost.

**Docs.** [Bundler Sponsored Operations](https://www.alchemy.com/docs/wallets/transactions/sponsor-gas/bundler-sponsored-operations). Log: #12.

---

## E. All error types in the demo

The demo turns errors into a message with "What to do" (`lib/errors.ts`). Order matters: Alchemy-specific texts are checked before generic network errors, because an Alchemy rejection can arrive inside an HTTP error.

| Type | Matches | User sees | Status |
|---|---|---|---|
| `policy-not-found` | `Policy ID(s) not found`, `Invalid Policy ID` | Gas sponsorship is turned off for this app | Reproduced (C1) |
| `limit-per-wallet` | `max count/spend per spender exceeded` | You reached the limit for your wallet | Reproduced (C2) |
| `limit-global` | `Policy max count exceeded`, `max spend global`, `MAX token limit` | The demo's gas budget is used up | From docs |
| `limit-per-tx` | `exceeds specified spend limit` | This transaction costs more than the app pays | From docs |
| `policy-dates` | `policy hasn't started`, `policy has ended` | Gas sponsorship is not active right now | From docs |
| `sender-list` | `policy's allowlist`, `policy's blocklist` | Not available for your wallet | From docs |
| `no-sponsorship` | `sender balance and deposit together` | Nobody paid for the gas | From docs (C5) |
| `pending-7702` | `EIP-7702 nonce mismatch`, `too many pending transactions`, `replacement underpriced`, `invalid account nonce` | Another transaction is still in progress | From docs |
| `price-changed` | `precheck failed: maxFeePerGas / maxPriorityFeePerGas / preVerificationGas` | Network fees changed while sending | From docs |
| `signer` | `not supported by external wallets`, `invalid account signature`, … | Your wallet could not sign | From code reading (C4) |
| `origin-blocked` | `origin not on whitelist` | This website is not allowed to use the key | Not documented, not reproduced. Pattern is a guess (B5) |
| `not-authenticated` | `must be authenticated`, `wallets are not ready` | Your login has expired | From Privy code |
| `user-rejected` | code 4001, `user rejected` | You cancelled the signature | Cannot happen in this demo: signing is silent (`showWalletUIs: false`). Kept for apps with a pop-up |
| `offline` | `Failed to fetch`, browser offline | No connection to the network | Reproduced (Chrome DevTools → Offline) |
| `timeout` | viem timeout errors | The network is slow. We stopped waiting | From viem code |
| `unknown` | anything else | Something went wrong + code + "Copy details" | — |

To add a new case: add a rule to `RULES` in `lib/errors.ts` above the generic rules, and a row to this table.
