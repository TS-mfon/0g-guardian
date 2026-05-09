import { AgentMarketplace } from "@/components/AgentMarketplace";
import { SiteNav } from "@/components/SiteNav";
import { clientConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export default function ProofsPage() {
  return (
    <main>
      <SiteNav />
      <section className="page-hero">
        <span className="section-kicker">Verified activity</span>
        <h1>Trace every agent launch back to 0G.</h1>
        <p>
          A clean audit surface for confirmed launches, Agent IDs, storage roots, task receipts,
          and revenue activity.
        </p>
      </section>
      <section className="proof-grid proof-grid-clean">
        <a href={`${clientConfig.explorerUrl}/address/${clientConfig.agentFunCoreAddress}`} target="_blank" rel="noreferrer">
          <span>Agent market</span><strong>Open contract</strong><p>Launches, keys, paid tasks, and revenue settlement.</p>
        </a>
        <a href={`${clientConfig.explorerUrl}/address/${clientConfig.agentIdContractAddress}`} target="_blank" rel="noreferrer">
          <span>Agent identity</span><strong>Open Agent ID</strong><p>Ownership and identity records for launched agents.</p>
        </a>
        <div>
          <span>Storage proofs</span><strong>Shown per agent</strong><p>Metadata, image, memory, and result roots appear only after confirmed actions.</p>
        </div>
      </section>
      <AgentMarketplace />
    </main>
  );
}
