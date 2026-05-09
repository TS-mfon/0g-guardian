import Link from "next/link";
import { loadAgentsFromChain } from "@/lib/agentfun";
import { genesisTemplates } from "@/lib/agent-templates";

export async function AgentMarketplace() {
  const agents = await loadAgentsFromChain();
  return (
    <section className="market-grid">
      {agents.length ? agents.map((agent) => (
        <Link className="agent-tile" href={`/agents/${agent.id}`} key={agent.id}>
          <div className="agent-orb">{agent.symbol.slice(0, 2)}</div>
          <span>{agent.category} · Agent #{agent.id}</span>
          <h3>{agent.name}</h3>
          <p>Agent ID {agent.agentIdTokenId}. {agent.taskCount} paid tasks. {agent.keySupply} keys issued.</p>
          <strong>{agent.totalRevenue} 0G revenue</strong>
        </Link>
      )) : genesisTemplates.map((agent) => (
        <Link className="agent-tile template" href="/launch" key={agent.name}>
          <div className="agent-orb">{agent.symbol.slice(0, 2)}</div>
          <span>Genesis template · launch on-chain</span>
          <h3>{agent.name}</h3>
          <p>{agent.description}</p>
          <strong>Launch this agent</strong>
        </Link>
      ))}
    </section>
  );
}
