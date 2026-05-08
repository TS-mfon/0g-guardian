import { Verdict } from "@shared/index";
import { hashJson } from "./hash";

export interface GuardianTestAgent {
  slug: string;
  name: string;
  role: string;
  owner: string;
  agentTokenId: string;
  status: "ready" | "needs-contract";
  tags: string[];
  summary: string;
  bestFor: string[];
  policy: {
    blockUnlimitedApprovals: boolean;
    blockUnknownSpenders: boolean;
    maxNativeValue: string;
    requireHumanConfirmationAboveRisk: number;
  };
  sampleIntent: {
    chainId: number;
    target: string;
    value: string;
    calldata: string;
    protocol: string;
    notes: string;
  };
  sampleReview: {
    riskScore: number;
    verdict: Verdict;
    detectedRisks: string[];
    recommendedAction: string;
    plainEnglishSummary: string;
    confidence: number;
    model: string;
    provider: string;
  };
}

export const guardianAgents: GuardianTestAgent[] = [
  {
    slug: "defi-approval-sentinel",
    name: "DeFi Approval Sentinel",
    role: "Allowance and spender firewall",
    owner: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    agentTokenId: "101",
    status: "ready",
    tags: ["defi-risk-review", "wallet-approval-firewall", "agent-memory"],
    summary:
      "Reviews ERC20 approvals, spender reputation, allowance size, and calldata shape before users sign wallet prompts.",
    bestFor: ["DEX approvals", "vault spend limits", "new protocol onboarding"],
    policy: {
      blockUnlimitedApprovals: true,
      blockUnknownSpenders: true,
      maxNativeValue: "0.05",
      requireHumanConfirmationAboveRisk: 420
    },
    sampleIntent: {
      chainId: 16661,
      target: "0x1234567890123456789012345678901234567890",
      value: "0",
      calldata:
        "0x095ea7b30000000000000000000000001234567890123456789012345678901234567890ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
      protocol: "ERC20 approval",
      notes: "Unknown spender requesting unlimited approval."
    },
    sampleReview: {
      riskScore: 875,
      verdict: Verdict.BLOCK,
      detectedRisks: ["ERC20 approval call detected", "Unlimited allowance pattern detected", "Spender is not in the user's known allowlist"],
      recommendedAction: "Do not sign. Reduce allowance or verify the spender contract independently.",
      plainEnglishSummary: "This approval gives an unknown spender unlimited access to the token balance.",
      confidence: 0.91,
      model: "0g-compute-guardian-review",
      provider: "0G Compute"
    }
  },
  {
    slug: "swap-slippage-guardian",
    name: "Swap Slippage Guardian",
    role: "Route, value, and slippage reviewer",
    owner: "0x54A9ed327F4B2a1Bf7583A6D9C7d5119f3F2a2a1",
    agentTokenId: "202",
    status: "ready",
    tags: ["swap-review", "mev-awareness", "transaction-simulation"],
    summary:
      "Checks swap calls for high slippage, unexpected recipients, attached native value, and MEV-sensitive execution patterns.",
    bestFor: ["token swaps", "aggregator routes", "high-value trades"],
    policy: {
      blockUnlimitedApprovals: false,
      blockUnknownSpenders: true,
      maxNativeValue: "0.25",
      requireHumanConfirmationAboveRisk: 500
    },
    sampleIntent: {
      chainId: 16661,
      target: "0x2222222222222222222222222222222222222222",
      value: "0.2",
      calldata: "0x7ff36ab50000000000000000000000000000000000000000000000000000000000000000",
      protocol: "DEX swap",
      notes: "Large swap through a new route with value attached."
    },
    sampleReview: {
      riskScore: 610,
      verdict: Verdict.WARN,
      detectedRisks: ["Native value attached", "Route target is not in local trusted list", "Slippage parameters need manual confirmation"],
      recommendedAction: "Confirm quoted output, recipient, and route before signing.",
      plainEnglishSummary: "The trade is not automatically unsafe, but it needs confirmation because value and route risk are present.",
      confidence: 0.84,
      model: "0g-compute-guardian-review",
      provider: "0G Compute"
    }
  },
  {
    slug: "socialfi-permission-guard",
    name: "SocialFi Permission Guard",
    role: "Delegation and account permission reviewer",
    owner: "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
    agentTokenId: "303",
    status: "ready",
    tags: ["socialfi", "delegation-review", "account-safety"],
    summary:
      "Reviews social and consumer dApp permissions for risky delegation, account-control escalation, and recurring authorization traps.",
    bestFor: ["posting permissions", "profile delegation", "consumer app onboarding"],
    policy: {
      blockUnlimitedApprovals: false,
      blockUnknownSpenders: true,
      maxNativeValue: "0.01",
      requireHumanConfirmationAboveRisk: 360
    },
    sampleIntent: {
      chainId: 16661,
      target: "0x3333333333333333333333333333333333333333",
      value: "0",
      calldata: "0xa22cb46500000000000000000000000044444444444444444444444444444444444444440000000000000000000000000000000000000000000000000000000000000001",
      protocol: "SocialFi delegation",
      notes: "App asks for operator approval for social account actions."
    },
    sampleReview: {
      riskScore: 540,
      verdict: Verdict.WARN,
      detectedRisks: ["Operator approval pattern detected", "Delegated permissions may persist beyond this session"],
      recommendedAction: "Approve only if the operator is known and revoke permissions after use.",
      plainEnglishSummary: "This permission may let another address act for the user until it is revoked.",
      confidence: 0.8,
      model: "0g-compute-guardian-review",
      provider: "0G Compute"
    }
  }
];

export function getGuardianAgent(slug: string) {
  return guardianAgents.find((agent) => agent.slug === slug);
}

export function agentProof(agent: GuardianTestAgent) {
  const profileHash = hashJson({
    name: agent.name,
    owner: agent.owner,
    agentTokenId: agent.agentTokenId,
    tags: agent.tags,
    policy: agent.policy
  });
  const reviewHash = hashJson({ intent: agent.sampleIntent, review: agent.sampleReview });
  return {
    profileHash,
    reviewHash,
    daCommitment: hashJson({ profileHash, reviewHash, channel: "0g-da-test-agent" })
  };
}

export function verdictText(verdict: Verdict) {
  if (verdict === Verdict.ALLOW) return "Allow";
  if (verdict === Verdict.WARN) return "Warn";
  if (verdict === Verdict.BLOCK) return "Block";
  return "Unknown";
}
