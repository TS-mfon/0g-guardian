import { SiteNav } from "@/components/SiteNav";
import { loadAgentsFromChain, loadEconomyFromChain, loadTasksFromChain } from "@/lib/agentfun";
import { getZeroGNetwork } from "@/lib/config";
import { getServerNetwork } from "@/lib/server-network";

export const dynamic = "force-dynamic";

function amount(value: number) {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 6 })} 0G`;
}

export default async function EconomyPage() {
  const networkKey = await getServerNetwork();
  const network = getZeroGNetwork(networkKey);
  const [agents, tasks] = await Promise.all([loadAgentsFromChain(networkKey), loadTasksFromChain(networkKey)]);
  const economy = await loadEconomyFromChain(agents, tasks, networkKey);
  const contractLink = `${network.explorerUrl}/address/${network.agentFunCoreAddress}`;

  return (
    <main>
      <SiteNav />
      <section className="page-hero">
        <span className="section-kicker">On-chain economy</span>
        <h1>Measure Agent.fun by useful paid work.</h1>
        <p>
          These metrics are calculated from the live AgentFunCoreV2 contract. V2 does not yet persist
          repeat-user, storage-cost, proven-stage, or graduated-stage counters, so those metrics remain explicitly unavailable.
        </p>
      </section>
      <section className="portfolio-grid economy-grid">
        <Metric label="Agents launched" value={String(economy.agentsLaunched)} note="Confirmed AgentLaunched records." />
        <Metric label="Activated agents" value={String(economy.activatedAgents)} note="Agents currently enabled for paid tasks." />
        <Metric label="Completed paid tasks" value={String(economy.completedTasks)} note="Tasks with completed settlement." />
        <Metric label="Unique paying users" value={String(economy.uniquePayingUsers)} note="Unique requesters among completed tasks." />
        <Metric label="Creator payouts accrued" value={amount(economy.creatorPayouts)} note="Cumulative creator task revenue stored per agent." />
        <Metric label="Protocol revenue claimable" value={amount(economy.protocolClaimable)} note="Current unclaimed protocol bucket." />
        <Metric label="Compute treasury claimable" value={amount(economy.computeClaimable)} note="Current activation seeds plus settled compute costs." />
        <Metric label="Recorded compute spend" value={amount(economy.recordedComputeSpend)} note="Actual compute cost on loaded completed tasks." />
        <Metric label="Revenue per active agent" value={amount(economy.averageRevenuePerActiveAgent)} note="Creator payouts divided by activated agents." />
        <Metric label="Task success rate" value={`${economy.taskSuccessRate.toFixed(1)}%`} note="Completed versus completed plus refunded tasks." />
        <Metric label="Estimated treasury runway" value={`${economy.treasuryRunwayTasks.toFixed(1)} tasks`} note="Current compute bucket divided by average recorded task cost." />
        <Metric label="Proven / graduated" value="Not tracked in V2" note="Requires the planned V3 lifecycle contract." />
      </section>
      <section className="proof-grid proof-grid-clean">
        <a href={contractLink} target="_blank" rel="noreferrer">
          <span>Evidence</span><strong>Inspect live contract</strong><p>Verify launches, tasks, treasury buckets, and creator accounting on 0G Chain.</p>
        </a>
        <div>
          <span>Accounting boundary</span><strong>No invented margin</strong><p>V2 does not store historical protocol claims or Storage expenditure, so net lifetime margin is not claimed here.</p>
        </div>
        <div>
          <span>Upgrade target</span><strong>Proof-of-utility lifecycle</strong><p>V3 will add Proven and Graduated stages, durable cost counters, ratings, and repeat-user metrics.</p>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <div><span>{label}</span><strong>{value}</strong><p>{note}</p></div>;
}
