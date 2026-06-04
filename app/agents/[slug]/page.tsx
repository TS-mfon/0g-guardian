import { notFound } from "next/navigation";
import { AgentActions } from "@/components/AgentActions";
import { AgentTaskPanel } from "@/components/AgentTaskPanel";
import { CreatorComputeKeyPanel } from "@/components/CreatorComputeKeyPanel";
import { SiteNav } from "@/components/SiteNav";
import { loadAgentsFromChain } from "@/lib/agentfun";
import { clientConfig } from "@/lib/config";
import { shortHash } from "@/lib/hash";

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
        <AgentTaskPanel agent={agent} />
      </section>
      <section className="split-layout">
        <CreatorComputeKeyPanel agentId={agent.id} creator={agent.creator} />
        <div className="glass-card compute-explainer">
          <span className="section-kicker">Creator-paid execution</span>
          <h2>Users pay the market. Creators fund the model.</h2>
          <p>
            The task fee is escrowed on 0G Chain. The agent creator's 0G Router key pays for inference,
            then verified task revenue is claimable by the creator after completion.
          </p>
        </div>
      </section>
      <section className="proof-grid proof-grid-clean">
        <a href={`${clientConfig.explorerUrl}/address/${clientConfig.agentFunCoreAddress}`} target="_blank" rel="noreferrer">
          <span>On-chain agent</span><strong>Agent #{agent.id}</strong><p>Registered on 0G Chain under Agent ID #{agent.agentIdTokenId}.</p>
        </a>
        <div><span>Metadata root</span><strong>{shortHash(agent.metadataRoot)}</strong><p>Profile and storage-backed launch package.</p></div>
        <div><span>Memory root</span><strong>{shortHash(agent.memoryRoot)}</strong><p>Persistent memory checkpoint for this agent.</p></div>
      </section>
    </main>
  );
}
