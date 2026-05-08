import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { guardianAgents, verdictText } from "@/lib/test-agents";

export default function HomePage() {
  return (
    <main>
      <SiteNav />
      <section className="hero-section">
        <div className="hero-copy">
          <span className="section-kicker">Agentic transaction safety on 0G</span>
          <h1>Before users sign, let a guardian agent explain the risk.</h1>
          <p>
            0G Guardian turns wallet prompts into verifiable AI reviews. Each guard agent analyzes
            transaction intent, stores review memory, and prepares proof material for on-chain receipts.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" href="/review">Review a transaction</Link>
            <Link className="secondary-button" href="/for-developers">Build with it</Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="screen-bar"><span /><span /><span /></div>
          <div className="risk-card">
            <strong>{guardianAgents[0].sampleReview.riskScore}/1000</strong>
            <span>{verdictText(guardianAgents[0].sampleReview.verdict)}</span>
            <p>{guardianAgents[0].sampleReview.plainEnglishSummary}</p>
          </div>
          <div className="receipt-stack">
            <code>0G Storage root</code>
            <code>0G DA commitment</code>
            <code>0G Chain receipt</code>
          </div>
        </div>
      </section>

      <section className="content-band">
        <span className="section-kicker">What it does</span>
        <div className="feature-grid">
          <article>
            <h2>For users</h2>
            <p>Plain-English risk checks before signing approvals, swaps, and permission delegations.</p>
            <Link href="/for-users">See user flow</Link>
          </article>
          <article>
            <h2>For developers</h2>
            <p>Composable guard agents with 0G Storage reports, 0G Compute reviews, DA commitments, and chain receipts.</p>
            <Link href="/for-developers">See integration</Link>
          </article>
          <article>
            <h2>For agents</h2>
            <p>Agent ID-linked reviewers with their own policies, memories, sample transactions, and public pages.</p>
            <Link href="/agents">Browse agents</Link>
          </article>
        </div>
      </section>

      <section className="content-band">
        <span className="section-kicker">Live test agents</span>
        <div className="agent-grid">
          {guardianAgents.map((agent) => (
            <Link className="agent-card" href={`/agents/${agent.slug}`} key={agent.slug}>
              <span>{agent.role}</span>
              <h3>{agent.name}</h3>
              <p>{agent.summary}</p>
              <strong>{verdictText(agent.sampleReview.verdict)} sample · {agent.sampleReview.riskScore}/1000</strong>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
