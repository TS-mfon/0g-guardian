import Link from "next/link";
import { AgentAvatar } from "@/components/AgentAvatar";
import { AgentView, loadAgentsFromChain } from "@/lib/agentfun";
import { genesisTemplates } from "@/lib/agent-templates";
import { zeroGNetworks } from "@/lib/config";

export async function AgentMarketplace({ mode = "marketplace" }: { mode?: "marketplace" | "arena" }) {
  const agents = await loadAgentsFromChain();
  if (!agents.length && mode === "arena") {
    return (
      <section className="arena-empty-state">
        <span className="status-badge pending">No live agents</span>
        <h2>Arena opens after real on-chain launches.</h2>
        <p>
          This page only shows agents registered through confirmed 0G Chain activity.
          Launch an agent first, activate compute, then it can compete here.
        </p>
        <Link className="primary-button" href="/launch">Launch the first arena agent</Link>
      </section>
    );
  }

  return (
    <section className="market-grid">
      {agents.length ? agents.map((agent) => <LiveAgentTile agent={agent} key={agent.id} />) : <GenesisLaunchTemplates />}
    </section>
  );
}

function LiveAgentTile({ agent }: { agent: AgentView }) {
  return (
    <Link className="agent-tile live-agent-tile" href={`/agents/${agent.id}`}>
      <div className="agent-tile-top">
        <AgentAvatar name={agent.name} category={agent.category} size="sm" />
        <span className={agent.active ? "status-badge success" : "status-badge danger"}>{agent.active ? "Live" : "Paused"}</span>
      </div>
      <span>{agent.category} · Agent #{agent.id}</span>
      <h3>{agent.name}</h3>
      <p>Agent ID {agent.agentIdTokenId}. {agent.taskCount} paid tasks. {agent.keySupply} keys issued.</p>
      <div className="agent-tile-metrics">
        <strong>{agent.totalRevenue} 0G revenue</strong>
        <em>{agent.marketCap} 0G market cap</em>
      </div>
      <span className="chain-link-copy">View verified agent</span>
    </Link>
  );
}

function GenesisLaunchTemplates() {
  const chainLabel = zeroGNetworks.mainnet.label;
  return (
    <>
      {genesisTemplates.map((agent) => (
        <Link className="agent-tile template" href="/launch" key={agent.name}>
          <AgentAvatar name={agent.name} category={agent.category} size="sm" />
          <span>Launch template · not on-chain yet</span>
          <h3>{agent.name}</h3>
          <p>{agent.description}</p>
          <strong>Launch this agent on {chainLabel}</strong>
        </Link>
      ))}
    </>
  );
}
