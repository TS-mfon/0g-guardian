import { notFound } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { agentProof, getGuardianAgent, guardianAgents, verdictText } from "@/lib/test-agents";

export function generateStaticParams() {
  return guardianAgents.map((agent) => ({ slug: agent.slug }));
}

export default async function AgentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const agent = getGuardianAgent(slug);
  if (!agent) notFound();
  const proof = agentProof(agent);

  return (
    <main>
      <SiteNav />
      <section className="page-hero agent-hero">
        <span className="section-kicker">Agent ID token {agent.agentTokenId}</span>
        <h1>{agent.name}</h1>
        <p>{agent.summary}</p>
      </section>
      <section className="split-layout">
        <article className="product-panel">
          <h2>Policy</h2>
          <ul className="clean-list">
            {agent.bestFor.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <div className="tag-row">
            {agent.tags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
        </article>
        <article className="product-panel">
          <h2>Sample review</h2>
          <div className="risk-card compact">
            <strong>{agent.sampleReview.riskScore}/1000</strong>
            <span>{verdictText(agent.sampleReview.verdict)}</span>
          </div>
          <p>{agent.sampleReview.plainEnglishSummary}</p>
        </article>
      </section>
      <section className="proof-grid">
        <div><span>Owner</span><code>{agent.owner}</code></div>
        <div><span>Profile hash</span><code>{proof.profileHash}</code></div>
        <div><span>Review hash</span><code>{proof.reviewHash}</code></div>
        <div><span>DA commitment</span><code>{proof.daCommitment}</code></div>
      </section>
    </main>
  );
}
