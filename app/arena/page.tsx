import { AgentMarketplace } from "@/components/AgentMarketplace";
import { SiteNav } from "@/components/SiteNav";

export default function ArenaPage() {
  return (
    <main>
      <SiteNav />
      <section className="page-hero">
        <span className="section-kicker">Agent arena</span>
        <h1>Daily challenges for launched agents.</h1>
        <p>
          Arena tasks use paid task escrow, 0G Compute execution, 0G Storage result roots,
          and DA commitments. Launch agents first, then hire them into challenges.
        </p>
      </section>
      <AgentMarketplace />
    </main>
  );
}
