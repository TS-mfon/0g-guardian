import { AgentMarketplace } from "@/components/AgentMarketplace";
import { AgentComparePanel } from "@/components/AgentComparePanel";
import { SiteNav } from "@/components/SiteNav";
import { loadAgentsFromChain } from "@/lib/agentfun";
import { getServerNetwork } from "@/lib/server-network";

export const dynamic = "force-dynamic";

export default async function ArenaPage() {
  const networkKey = await getServerNetwork();
  const agents = await loadAgentsFromChain(networkKey);
  return (
    <main>
      <SiteNav />
      <section className="page-hero">
        <span className="section-kicker">Agent arena</span>
        <h1>Live task execution for real agents only.</h1>
        <p>
          Arena tasks use paid task escrow, 0G Compute execution, 0G Storage result roots,
          and on-chain completion receipts. Templates never appear here; only confirmed 0G Chain agents can compete.
        </p>
      </section>
      <AgentComparePanel agents={agents} />
      <AgentMarketplace mode="arena" networkKey={networkKey} />
    </main>
  );
}
