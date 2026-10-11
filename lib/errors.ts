// Turns raw errors from Privy, viem and Alchemy into messages a person can act on.
// Error texts come from:
// - https://www.alchemy.com/docs/wallets/troubleshooting/wallet-apis-errors
// - https://www.alchemy.com/docs/wallets/reference/gas-manager-errors
// Each case here has a matching section in TROUBLESHOOTING.md.

export type FriendlyError = {
  id: string; // short id, matches TROUBLESHOOTING.md
  title: string;
  explanation: string;
  action: string;
  code?: string | number;
  details: string;
};

// Order matters: specific Alchemy errors first, generic network errors last,
// because an Alchemy rejection can arrive wrapped in an HTTP error.
type Rule = {
  id: string;
  test: (text: string, err: ErrorFacts) => boolean;
  title: string;
  explanation: string;
  action: string;
};

type ErrorFacts = { names: string[]; codes: (string | number)[] };

const RULES: Rule[] = [
  {
    id: "user-rejected",
    test: (t, f) =>
      f.codes.includes(4001) ||
      f.names.includes("UserRejectedRequestError") ||
      /user (rejected|denied|cancel)|rejected the request|request (was )?cancel/i.test(t),
    title: "You cancelled the signature.",
    explanation: "Nothing was sent. No changes were made to your wallet.",
    action: "Press the button again when you are ready.",
  },
  {
    id: "origin-blocked",
    test: (t) => /origin not on (white|allow)list|unspecified origin|origin .*not allowed/i.test(t),
    title: "This website is not allowed to use the Alchemy key.",
    explanation: "The Alchemy app has a domain allowlist, and this website is not on it.",
    action: "Site owner: add this domain in Alchemy Dashboard → your app → Security → Domain.",
  },
  {
    id: "policy-not-found",
    test: (t) => /policy id\(s\) not found|invalid policy id/i.test(t),
    title: "Gas sponsorship is turned off for this app.",
    explanation:
      "Alchemy did not accept the gas policy. It may be inactive, or it may belong to a different Alchemy app than the API key.",
    action:
      "Try again later. Site owner: check that the policy is Active, uses Arbitrum Sepolia, and belongs to the same app as the API key.",
  },
  {
    id: "policy-dates",
    test: (t) => /policy hasn'?t started|policy has ended/i.test(t),
    title: "Gas sponsorship is not active right now.",
    explanation: "The gas policy has a start or end date, and today is outside it.",
    action: "Site owner: check the policy dates in Alchemy Dashboard → Gas Sponsorship → Settings.",
  },
  {
    id: "limit-per-wallet",
    test: (t) => /max (spend|count) per spender exceeded/i.test(t),
    title: "You reached the limit for your wallet.",
    explanation:
      "This demo pays gas for a limited number of transactions per wallet. Your wallet used all of them.",
    action: "This is expected. The limit protects the demo from abuse. Try with another email.",
  },
  {
    id: "limit-global",
    test: (t) => /policy max (count|spend global) exceeded|max token limit/i.test(t),
    title: "The demo's gas budget is used up.",
    explanation: "The app paid for many transactions and reached its total limit.",
    action: "Try again later. Site owner: raise the total limit in the gas policy.",
  },
  {
    id: "limit-per-tx",
    test: (t) => /exceeds specified spend limit/i.test(t),
    title: "This transaction costs more than the app pays for one transaction.",
    explanation: "The network is expensive right now, or the transaction is bigger than usual.",
    action: "Try again in a few minutes.",
  },
  {
    id: "sender-list",
    test: (t) => /policy'?s allowlist|in policy'?s blocklist/i.test(t),
    title: "Gas sponsorship is not available for your wallet.",
    explanation: "The gas policy only pays for some wallets, and yours is not one of them.",
    action: "Site owner: check the Access control tab of the gas policy.",
  },
  {
    id: "no-sponsorship",
    test: (t) => /sender balance and deposit together/i.test(t),
    title: "Nobody paid for the gas.",
    explanation: "The request went out without a gas policy, so the network asked your wallet to pay. Your wallet has 0 ETH.",
    action: "Site owner: check that NEXT_PUBLIC_ALCHEMY_POLICY_ID is set.",
  },
  {
    id: "pending-7702",
    test: (t) => /eip-7702 nonce mismatch|too many pending transactions|replacement underpriced|invalid account nonce/i.test(t),
    title: "Another transaction from your wallet is still in progress.",
    explanation: "The network accepts one transaction at a time while your wallet is being set up.",
    action: "Wait 30 seconds and try again.",
  },
  {
    id: "price-changed",
    test: (t) => /precheck failed: (maxfeepergas|maxpriorityfeepergas|preverificationgas)/i.test(t),
    title: "Network fees changed while sending.",
    explanation: "The price of gas moved between preparing and sending the transaction.",
    action: "Press the button again. It usually works the second time.",
  },
  {
    id: "signer",
    test: (t) => /does not support signing authorization|not supported by external wallets|invalid account signature|authorization signature is invalid/i.test(t),
    title: "Your wallet could not sign this transaction.",
    explanation: "The signature was missing or not valid.",
    action: "Sign out, sign in again, and retry.",
  },
  {
    id: "not-authenticated",
    test: (t) => /must be authenticated|wallets are not ready|session.*expired/i.test(t),
    title: "Your login has expired.",
    explanation: "The wallet cannot sign without an active login.",
    action: "Sign out and sign in again.",
  },
  {
    id: "offline",
    test: (t) =>
      (typeof navigator !== "undefined" && navigator.onLine === false) ||
      /failed to fetch|networkerror|network request failed|load failed|err_internet_disconnected/i.test(t),
    title: "No connection to the network.",
    explanation: "The site could not reach Alchemy. Your internet may be off, or the service may be busy.",
    action: "Check your internet connection and try again.",
  },
  {
    id: "timeout",
    test: (t, f) =>
      f.names.some((n) => /Timeout/i.test(n)) || /timed? ?out/i.test(t),
    title: "The network is slow. We stopped waiting.",
    explanation:
      "The transaction may still go through. We just did not get the result in 2 minutes.",
    action: "Open your wallet in Arbiscan (link above) to check, then refresh the page.",
  },
];

export function explainError(err: unknown): FriendlyError {
  const facts = collectFacts(err);
  const text = facts.messages.join(" | ");
  const code = facts.codes[0];

  for (const rule of RULES) {
    if (rule.test(text, facts)) {
      return {
        id: rule.id,
        title: rule.title,
        explanation: rule.explanation,
        action: rule.action,
        code,
        details: shorten(text),
      };
    }
  }

  return {
    id: "unknown",
    title: "Something went wrong.",
    explanation: "We did not expect this error.",
    action:
      "Try again. If it happens again, copy the technical details below and send them to the site owner.",
    code,
    details: shorten(text || String(err)),
  };
}

function shorten(text: string, max = 600) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

// Errors from viem and Alchemy wrap each other. Walk the whole chain.
function collectFacts(err: unknown) {
  const messages: string[] = [];
  const names: string[] = [];
  const codes: (string | number)[] = [];
  const seen = new Set<unknown>();
  let current: unknown = err;

  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    const e = current as Record<string, unknown>;
    // viem puts the full request body into "message". "shortMessage" + "details" are enough.
    const keys = typeof e.shortMessage === "string" ? ["shortMessage", "details"] : ["message"];
    for (const key of keys) {
      const v = e[key];
      if (typeof v === "string" && v && !messages.some((m) => m.includes(v))) messages.push(v);
    }
    if (typeof e.name === "string") names.push(e.name);
    if (typeof e.code === "number" || typeof e.code === "string") codes.push(e.code);
    current = e.cause;
  }
  if (typeof err === "string") messages.push(err);
  return { messages, names, codes };
}
