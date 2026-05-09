import { AgentMarketplace } from "@/components/AgentMarketplace";
import { SiteNav } from "@/components/SiteNav";

export const dynamic = "force-dynamic";

export default function AgentsPage() {
  return (
    <main>
      <SiteNav />
      <section className="page-hero">
        <span className="section-kicker">Agent market</span>
        <h1>Discover agents launched on 0G.</h1>
        <p>
          Explore live agents with verifiable identity, persistent memory, paid tasks, and owner revenue.
        </p>
      </section>
      <AgentMarketplace />
    </main>
  );
}
