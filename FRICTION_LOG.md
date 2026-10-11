# Friction Log

This log records every place where I got stuck or confused while building this demo with Alchemy Wallet APIs. I wrote each entry at the moment it happened. Times are real.

Setup: Next.js 16, React 19, `@alchemy/wallet-apis` 5.3.0, `@privy-io/react-auth` 3.48.1, `viem` 2.56.5 (pinned, see entry 7). Network: Arbitrum Sepolia. Date: October 2026.

Severity:
- **High**: blocks the developer or can cause a security problem.
- **Medium**: costs time or causes doubt.
- **Low**: small, but adds up.

---

## 1. Privy page gives two different setup rules

| | |
|---|---|
| **Step** | Reading docs before setup |
| **Severity** | Medium |
| **Expected** | One clear list of what must be linked to my Alchemy app. |
| **What happened** | The Privy page has two tabs. The React tab says only the gas sponsorship policy must be linked to the app. The JavaScript (server) tab says both the "Wallet APIs configuration" and the policy must be linked. I don't know if the React path also needs the "Wallet APIs configuration", or what that is. No other page explains it. |
| **Time lost** | 5 min so far. Still open. |
| **Fix** | Open. I will check the dashboard during setup and update this entry. |
| **Suggestion** | Use the same warning on both tabs. Add one sentence that explains what "Wallet APIs configuration" is and where to find it in the dashboard. |

## 2. Examples put the API key in browser code without a warning

| | |
|---|---|
| **Step** | Reading docs before setup |
| **Severity** | High |
| **Expected** | A note on how to protect the API key in a public web app. |
| **What happened** | The React example on the Privy page puts the Alchemy API key directly in browser code. Anyone who opens the site can copy it. The page does not say what the risk is, or how to limit it (domain allowlist, spend limits on the policy, or a server proxy). A new developer will copy the example as it is. |
| **Time lost** | 10 min to read around and decide what to do. |
| **Fix** | For this demo: low limits on the gas policy, and a domain allowlist on the key if the dashboard supports it. Details will be added after dashboard setup. |
| **Suggestion** | Add a short "Before you go live" box to the React examples: "This key is visible in the browser. Restrict it to your domain and set spend limits on your policy." Link to the page that shows how. |

## 3. The full dashboard setup order is not on one page

| | |
|---|---|
| **Step** | Reading docs before setup |
| **Severity** | Medium |
| **Expected** | One checklist: create app, enable network, create policy, link policy, copy IDs. |
| **What happened** | The steps are spread over the Quickstart, the Privy page, the Sponsor gas overview and the "Create sponsorship policies" page. Only the last page says the network must already be enabled on the app before you create a policy. If you skip it, the network is not in the policy's list and you don't know why. The "Sponsor gas overview" link is a hub page with cards, not the steps. |
| **Time lost** | 10 min to collect the steps from four pages. |
| **Fix** | I wrote my own checklist (see README). |
| **Suggestion** | Put a 5-step "Dashboard setup" checklist at the top of the Quickstart, in the right order, with the "enable the network first" rule in it. |

## 4. The SDK installs an alpha package and two copies of the same Alchemy package

| | |
|---|---|
| **Step** | Install packages |
| **Severity** | Low |
| **Expected** | A stable SDK release with stable dependencies. |
| **What happened** | `@alchemy/wallet-apis@5.3.0` depends on `@alchemy/wallet-api-types@0.2.0-alpha.6`. That package brings `@alchemy/common@5.2.0`, while the SDK itself uses `@alchemy/common@5.3.0`. So the project has two versions of the same Alchemy package. It works so far, but two copies can cause type errors that are hard to understand. And an alpha package inside a stable release makes a careful team ask questions. |
| **Time lost** | 5 min to find out why `npm ls` showed two versions. |
| **Fix** | None needed yet. Watching for type errors. |
| **Suggestion** | Release the types package as stable, and keep all `@alchemy/*` dependencies on the same version in each release. |

## 5. The recommended signer adds 650 packages and deprecation warnings

| | |
|---|---|
| **Step** | Install packages |
| **Severity** | Low |
| **Expected** | A light install, since the docs say "under 10 minutes". |
| **What happened** | Installing the three packages from the Privy guide added 650 packages and took about 1.5 minutes. npm printed 10 "deprecated" warnings (WalletConnect, MetaMask SDK) and 25 known vulnerabilities in production dependencies. I traced them: they come from `@privy-io/react-auth`, not from Alchemy. But a developer sees them right after following Alchemy's guide, and may think the Alchemy SDK is the problem. |
| **Time lost** | 5 min to trace where the warnings come from. |
| **Fix** | None. These are not Alchemy packages. |
| **Suggestion** | Add one line to the Privy guide: "Privy's React package brings wallet connectors and may show npm warnings. They do not come from `@alchemy/wallet-apis`." This saves a support ticket. |

## 6. Install works on my machine, then fails on Vercel

| | |
|---|---|
| **Step** | First deploy to Vercel |
| **Severity** | High |
| **Expected** | The three packages from the Privy guide install the same way everywhere. |
| **What happened** | The first `npm install` on my machine finished with no error. But the first Vercel build failed in 5 seconds with `npm error code ERESOLVE`. I could repeat it locally: a second clean install (`npm ci` or `npm install` with the lock file) fails the same way. The reason: `@alchemy/wallet-apis@5.3.0` has an optional peer `@solana/kit >=6.0.0`. `@privy-io/react-auth@3.48` brings `@solana/kit@5.5.1`, and its Solana helper packages (`@solana-program/system`, `@solana-program/token` and others) need `@solana/kit ^5.0`. So the two packages that the Alchemy docs tell you to use together cannot agree on one version. npm lets the first install pass with an "invalid" tree, and only a clean install shows the error. The error text talks about Solana and Coinbase packages, so an EVM developer has no idea why. |
| **Time lost** | 40 min (one failed deploy, finding the cause, testing two fixes). |
| **Fix** | Added `.npmrc` with `legacy-peer-deps=true`. Privy keeps the versions it expects. Alchemy's Solana part gets 5.5.1, which is fine because this demo uses EVM only. I also tested the other fix: install `@solana/kit@^6` at the top level. It also builds, but it forces Privy's Solana helpers onto a version they don't support and adds about 150 extra packages. |
| **Suggestion** | 1) Test the Privy guide install in CI with a clean `npm ci`, not only with a first install. 2) Until the versions match, add a note to the Privy guide: "If you see ERESOLVE about `@solana/kit`, add `legacy-peer-deps=true` to `.npmrc` (EVM only) or ..." 3) Long term: move Solana support into a separate entry point or package, so EVM-only users don't get Solana peer conflicts at all. |

## 7. The workaround for entry 6 hides three other problems

| | |
|---|---|
| **Step** | Adding Privy login (stage 2) |
| **Severity** | High |
| **Expected** | After the fix in entry 6, the project builds when I add the Privy provider. |
| **What happened** | The build failed: `Module not found: Can't resolve '@stripe/stripe-js'`. The import comes from Privy's fiat on-ramp screen, which I don't use. With `legacy-peer-deps=true`, npm stops installing peer packages, and it also stops checking them. I then checked the whole tree and found two more silent problems: (1) `wagmi` (pulled in by Privy) needs `@tanstack/react-query`, which was missing; (2) Privy needs `viem` at exactly `2.56.5`, but npm installed `2.57.4`. Two viem copies can break the signer that Alchemy gets from Privy, and nothing warned me. So the "simple" fix from entry 6 costs a full manual check of peer packages. |
| **Time lost** | 25 min. |
| **Fix** | Added `@stripe/stripe-js@^1.46.0` and `@tanstack/react-query@^5`. Pinned `viem` to `2.56.5` (exact). Alchemy accepts `viem ^2.45.0`, so this works for both. Checked with a clean `npm ci` and `npm ls`. |
| **Suggestion** | The same as entry 6: one tested `package.json` for "Alchemy Wallet APIs + Privy" in the docs or in a starter repo, with exact versions. Also tell users which `viem` version works with the current Privy release, because Privy pins it exactly. |

## 8. Privy dashboard labels don't match the Privy docs

| | |
|---|---|
| **Step** | Privy dashboard setup (done by Leonid) |
| **Severity** | Low |
| **Expected** | Find the App ID and the domain list by the names in the docs. |
| **What happened** | Privy docs say: App ID is in Configuration → App settings → **Basics** tab; domains are in the **Domains** tab, field **Allowed Origins**. In the real dashboard: the menu is **App settings → Basics**, and Basics is a page with its own tabs: **API keys**, **Domains and clients**, **Privy Home**, **Advanced**. The field is **Allowed origins**, with an **Add** button for each domain. Also, the Alchemy Privy guide does not mention allowed origins at all, so a developer who deploys the example may not know this step exists. |
| **Time lost** | Not measured. |
| **Fix** | Found by clicking around. Added `http://localhost:3000` and the Vercel domain. |
| **Suggestion** | For Alchemy: add one line to the Privy guide: "Before you deploy, add your domain in Privy Dashboard → App settings → Basics → Domains and clients → Allowed origins." This is not Alchemy's UI, but it is part of Alchemy's recommended path, so the user will blame the path. |

## 9. The Privy example takes the first wallet, which may be the wrong one

| | |
|---|---|
| **Step** | Adding Privy login (stage 2) |
| **Severity** | Low |
| **Expected** | The example gets the Privy embedded wallet. |
| **What happened** | The Alchemy Privy guide uses `const { wallets: [wallet] } = useWallets()`. `useWallets()` returns all connected wallets, including external ones like MetaMask. If an app also allows wallet login, the first wallet can be MetaMask. Then the 7702 flow breaks, because MetaMask does not sign EIP-7702 authorizations for other contracts (the Alchemy EIP-7702 page says this itself). |
| **Time lost** | 5 min (found while reading Privy types). |
| **Fix** | Pick the wallet with `walletClientType === "privy"`. Confirmed later in Privy's code: its viem account throws "EIP-7702 authorization signing is not supported by external wallets" for any wallet that is not the Privy embedded one. So with the guide's example, the first transaction fails for those users. |
| **Suggestion** | Change the example to `wallets.find((w) => w.walletClientType === "privy")` and add one comment about why. |

## 10. "Create app" has no "Wallet APIs" service to pick

| | |
|---|---|
| **Step** | Alchemy dashboard: Create new app (done by Leonid) |
| **Severity** | Medium |
| **Expected** | A "Wallet APIs" or "Smart Wallets" option, since the docs call the product "Wallet APIs". |
| **What happened** | The service picker shows 15 cards: Webhooks, Transfers API, Node API, NFT API, Token API, Prices API, Bundler API, Debug API, Block Timestamp API, Gas Manager, Trace API, Transaction Receipts API, userOp Simulation API, Websockets. None of them is called "Wallet APIs". A new user has to guess that Wallet APIs need Gas Manager + Bundler API (+ Node API). The Privy guide also talks about a "Wallet APIs configuration" that must be linked to the app (see entry 1), and this screen does not show it either. Leonid stopped here and had to ask what to choose. |
| **Time lost** | Not measured yet. |
| **Fix** | Picked Node API, Bundler API and Gas Manager. |
| **Suggestion** | Add a "Wallet APIs (smart wallets, gas sponsorship)" card that turns on all services it needs in one click. Or add one line in the Quickstart: "When you create the app, select Node API, Bundler API and Gas Manager." |

## 11. Policy limits: does "0" mean "no limit" or "nothing allowed"?

| | |
|---|---|
| **Step** | Alchemy dashboard: gas policy limits (done by Leonid) |
| **Severity** | Medium |
| **Expected** | Clear meaning of each field. |
| **What happened** | A new policy shows "Per-wallet limit: $0.00" and "Total transaction limit: 0". The screen does not say if 0 means "unlimited" or "block everything". If it means "block", the first sponsored transaction fails, and the developer looks for the bug in the code. If it means "unlimited", a public demo has no cap. Also the page shows "Available balance: $0.00" next to an Active policy on the Free tier. It is not clear if testnet sponsorship needs a balance. |
| **Time lost** | 5 min. |
| **Fix** | Set every field to an explicit non-zero number, so the meaning does not matter. The $0 balance question is answered by stage 4: the first sponsored transaction on Arbitrum Sepolia went through with "Available balance: $0.00" ([tx](https://sepolia.arbiscan.io/tx/0xcaf326a2ddd782695a6b79cc69176fcd4335236237a2a6a6c206798d0bc95092)). So testnet sponsorship does not need a balance, but the dashboard does not say it. |
| **Suggestion** | Show "No limit" as a placeholder for empty fields instead of "0". Add a line under the balance on testnets: "Testnet sponsorship is free. Balance is used for mainnet only." (if this is true). |

## 12. In the explorer, a sponsored transaction looks like "no paymaster, gas cost 0"

| | |
|---|---|
| **Step** | Checking the batch transaction in Arbiscan (stage 5) |
| **Severity** | Low |
| **Expected** | Some sign in the explorer that Alchemy sponsored the gas, like a paymaster address. |
| **What happened** | In the `UserOperationEvent` log of [the batch transaction](https://sepolia.arbiscan.io/tx/0x41a179ec94ee33584a9c83869787a8dbe46c94b4e868d2ab1b610bfaf69e3cf1#eventlog): `paymaster = 0x0000…0000` and `actualGasCost = 0`. The real fee (0.0000023 ETH) is paid in the outer transaction by the bundler (`0x1c5F…7247`). This is how Bundler Sponsored Operations (the recommended "Gas Sponsorship" policy type) work: no onchain paymaster. But a developer who checks "was this sponsored?" in the explorer sees "no paymaster, cost 0" and may think sponsorship did not work, or that the user paid. The BSO page explains that there are no onchain contracts, but does not show what the result looks like in an explorer. |
| **Time lost** | 10 min to understand the log. |
| **Fix** | None needed. The user's balance stayed 0 ETH, which is the real proof. |
| **Suggestion** | Add a short "How to verify sponsorship" box to the BSO page: "In the explorer, `paymaster` is `0x0` and `actualGasCost` is 0. The bundler pays in the outer transaction. Check the Usage tab of your policy to see the cost." |

---

## Top 3 improvements I would ship first

To be written at the end, after all steps are done.
