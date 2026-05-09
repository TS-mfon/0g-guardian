import { AgentMarketplace } from "@/components/AgentMarketplace";
import { SiteNav } from "@/components/SiteNav";
import { clientConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export default function ProofsPage() {
  return (
    <main>
      <SiteNav />
      <section className="page-hero">
        <span className="section-kicker">Proof explorer</span>
        <h1>0G proof links for judges and users.</h1>
        <p>
          The marketplace reads real contract state when deployed. Each launched agent carries metadata roots,
          memory roots, Agent ID token IDs, task events, compute hashes, and DA commitments.
        </p>
      </section>
      <section className="proof-grid">
        <div><span>AgentFunCore</span><code>{clientConfig.agentFunCoreAddress || "not configured"}</code></div>
        <div><span>Agent ID contract</span><code>{clientConfig.agentIdContractAddress || "not configured"}</code></div>
        <div><span>0G RPC</span><code>{clientConfig.rpcUrl}</code></div>
      </section>
      <AgentMarketplace />
    </main>
  );
}
