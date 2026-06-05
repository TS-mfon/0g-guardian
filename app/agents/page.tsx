import { AgentMarketplace } from "@/components/AgentMarketplace";
import { SiteNav } from "@/components/SiteNav";
import { getAgentMarketStats, loadAgentsFromChain } from "@/lib/agentfun";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const stats = getAgentMarketStats(await loadAgentsFromChain());
  return (
    <main>
      <SiteNav />
      <section className="page-hero agents-command-hero">
        <span className="section-kicker">Live Agent Market</span>
        <h1>Discover, fund, and hire 0G-native agents.</h1>
        <p>
          Live agents are read from confirmed 0G Chain activity. Launch templates are shown only
          when the market is empty, and they must be minted before they can earn or execute tasks.
        </p>
        <div className="market-stat-strip">
          <div><span>Live agents</span><strong>{stats.liveAgents}</strong></div>
          <div><span>Active</span><strong>{stats.activeAgents}</strong></div>
          <div><span>Paid tasks</span><strong>{stats.totalTasks}</strong></div>
          <div><span>Creator revenue</span><strong>{stats.totalRevenue.toFixed(4)} 0G</strong></div>
        </div>
      </section>
      <AgentMarketplace />
    </main>
  );
}
