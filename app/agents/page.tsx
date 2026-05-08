import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { guardianAgents, verdictText } from "@/lib/test-agents";

export default function AgentsPage() {
  return (
    <main>
      <SiteNav />
      <section className="page-hero">
        <span className="section-kicker">Guardian agents</span>
        <h1>Every registered test guardian has its own review policy and page.</h1>
        <p>Use these seeded agents to test the dApp flow with real deterministic sample data instead of empty state.</p>
      </section>
      <section className="agent-grid wide-grid">
        {guardianAgents.map((agent) => (
          <Link className="agent-card" href={`/agents/${agent.slug}`} key={agent.slug}>
            <span>Token {agent.agentTokenId}</span>
            <h2>{agent.name}</h2>
            <p>{agent.summary}</p>
            <strong>{verdictText(agent.sampleReview.verdict)} sample · {agent.sampleReview.riskScore}/1000</strong>
          </Link>
        ))}
      </section>
    </main>
  );
}
