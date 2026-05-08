import { SiteNav } from "@/components/SiteNav";
import { agentProof, guardianAgents } from "@/lib/test-agents";

export default function ProofsPage() {
  return (
    <main>
      <SiteNav />
      <section className="page-hero">
        <span className="section-kicker">Proof explorer</span>
        <h1>One page, one job: inspect deterministic proof material.</h1>
        <p>These test agents expose deterministic hashes so visitors can understand the proof model before connecting a wallet.</p>
      </section>
      <section className="proof-grid">
        {guardianAgents.map((agent) => {
          const proof = agentProof(agent);
          return (
            <div key={agent.slug}>
              <span>{agent.name}</span>
              <code>{proof.profileHash}</code>
              <code>{proof.reviewHash}</code>
              <code>{proof.daCommitment}</code>
            </div>
          );
        })}
      </section>
    </main>
  );
}
