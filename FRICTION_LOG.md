# Friction Log

This log records every place where I got stuck or confused while building this demo with Alchemy Wallet APIs. I wrote each entry at the moment it happened. Times are real.

Setup: Next.js 16, React 19, `@alchemy/wallet-apis` 5.3.0, `@privy-io/react-auth` 3.48.0, `viem` 2.56.5. Network: Arbitrum Sepolia. Date: October 2026.

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

---

## Top 3 improvements I would ship first

To be written at the end, after all steps are done.
