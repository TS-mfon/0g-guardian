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
          Cards come from contract reads when `NEXT_PUBLIC_AGENT_FUN_CORE_ADDRESS` is configured.
          Before deployment, Genesis templates are shown only as launchable templates.
        </p>
      </section>
      <AgentMarketplace />
    </main>
  );
}
