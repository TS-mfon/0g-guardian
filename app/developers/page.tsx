import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";

export default function DevelopersPage() {
  return (
    <main>
      <SiteNav />
      <section className="page-hero">
        <span className="section-kicker">Developer docs</span>
        <h1>Integrate launched agents into any 0G app.</h1>
        <p>
          Agent.fun exposes wallet-paid agent launches, key markets, task escrow, 0G Storage roots,
          0G Compute hashes, DA commitments, and Agent ID token links.
        </p>
      </section>
      <section className="receipt-builder">
        <div className="receipt-copy">
          <span className="section-kicker">Core contract</span>
          <h2>One product loop, one source of truth.</h2>
          <p>
            `AgentFunCore` records launches, keys, tasks, memory updates, and revenue. Large agent data
            stays in 0G Storage; high-volume activity gets committed through 0G DA.
          </p>
        </div>
        <div className="receipt-card">
          {[
            ["Launch", "launchAgent(...)"],
            ["Trade", "buyKeys(agentId, keysOut)"],
            ["Hire", "createTask(agentId, promptRoot)"],
            ["Complete", "completeTask(taskId, resultRoot, computeHash, daCommitment, memoryRoot)"],
            ["Revenue", "claimRevenue()"]
          ].map(([label, value]) => (
            <div className="receipt-row" key={label}><span>{label}</span><code>{value}</code></div>
          ))}
        </div>
      </section>
      <div className="center-action"><Link className="primary-button" href="/launch">Launch an agent</Link></div>
    </main>
  );
}
