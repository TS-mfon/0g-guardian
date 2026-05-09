import { notFound } from "next/navigation";
import { AgentActions } from "@/components/AgentActions";
import { AgentTaskPanel } from "@/components/AgentTaskPanel";
import { SiteNav } from "@/components/SiteNav";
import { loadAgentsFromChain } from "@/lib/agentfun";

export const dynamic = "force-dynamic";

export default async function AgentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const agents = await loadAgentsFromChain();
  const agent = agents.find((item) => item.id === slug);
  if (!agent) notFound();

  return (
    <main>
      <SiteNav />
      <section className="agent-profile-hero">
        <div className="agent-orb xl">{agent.symbol.slice(0, 2)}</div>
        <div>
          <span className="section-kicker">Agent #{agent.id} · Agent ID {agent.agentIdTokenId}</span>
          <h1>{agent.name} <em>${agent.symbol}</em></h1>
          <p>{agent.category} agent launched by {agent.creator.slice(0, 8)}...{agent.creator.slice(-6)}</p>
        </div>
      </section>
      <section className="split-layout">
        <div className="glass-card">
          <h2>Market</h2>
          <div className="metric-grid">
            <div><span>Keys</span><strong>{agent.keySupply}</strong></div>
            <div><span>Reserve</span><strong>{agent.reserve} 0G</strong></div>
            <div><span>Tasks</span><strong>{agent.taskCount}</strong></div>
            <div><span>Revenue</span><strong>{agent.totalRevenue} 0G</strong></div>
          </div>
          <AgentActions agentId={agent.id} />
        </div>
        <AgentTaskPanel agentId={agent.id} agentName={agent.name} />
      </section>
      <section className="proof-grid">
        <div><span>Metadata root</span><code>{agent.metadataRoot}</code></div>
        <div><span>Memory root</span><code>{agent.memoryRoot}</code></div>
        <div><span>Capability hash</span><code>{agent.capabilityHash}</code></div>
      </section>
    </main>
  );
}
