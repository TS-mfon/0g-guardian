import { AgentMarketplace } from "@/components/AgentMarketplace";
import { SiteNav } from "@/components/SiteNav";
import { getZeroGNetwork } from "@/lib/config";
import { getServerNetwork } from "@/lib/server-network";

export const dynamic = "force-dynamic";

export default async function ProofsPage() {
  const networkKey = await getServerNetwork();
  const network = getZeroGNetwork(networkKey);
  return (
    <main>
      <SiteNav />
      <section className="page-hero">
        <span className="section-kicker">Verified activity</span>
        <h1>Trace every agent launch back to 0G.</h1>
        <p>
          A clean audit surface for confirmed launches, Agent IDs, storage roots, task receipts,
          and key-market activity.
        </p>
      </section>
      <section className="proof-grid proof-grid-clean">
        <a href={`${network.explorerUrl}/address/${network.agentFunCoreAddress}`} target="_blank" rel="noreferrer">
          <span>Agent market</span><strong>Open contract</strong><p>Launches, keys, paid tasks, and creator settlement.</p>
        </a>
        <a href={`${network.explorerUrl}/address/${network.agentIdContractAddress}`} target="_blank" rel="noreferrer">
          <span>Agent identity</span><strong>Open Agent ID</strong><p>Ownership and identity records for launched agents.</p>
        </a>
        <div>
          <span>Storage proofs</span><strong>Shown per agent</strong><p>Metadata, memory, prompt, and result roots appear only after confirmed actions.</p>
        </div>
      </section>
      <AgentMarketplace networkKey={networkKey} />
    </main>
  );
}
