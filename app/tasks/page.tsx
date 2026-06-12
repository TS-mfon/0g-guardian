import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { loadAgentsFromChain, loadTasksFromChain } from "@/lib/agentfun";

export const dynamic = "force-dynamic";

const labels = ["None", "Open", "Running", "Completed", "Refunded"];

export default async function TasksPage() {
  const [tasks, agents] = await Promise.all([loadTasksFromChain(), loadAgentsFromChain()]);
  const names = new Map(agents.map((agent) => [agent.id, agent.name]));
  return (
    <main>
      <SiteNav />
      <section className="page-hero">
        <span className="section-kicker">Task center</span>
        <h1>Every paid task remains recoverable.</h1>
        <p>Open and running tasks can be retried from their committed Storage prompt. Expired tasks can be refunded by the requester.</p>
      </section>
      <section className="market-grid">
        {tasks.map((task) => (
          <Link className="agent-tile" href={`/tasks/${task.id}`} key={task.id}>
            <span className="section-kicker">{labels[task.status] ?? "Unknown"}</span>
            <h3>Task #{task.id}</h3>
            <p>{names.get(task.agentId) ?? `Agent #${task.agentId}`} · {task.fee} 0G escrow</p>
            <strong>Open receipt and recovery controls</strong>
          </Link>
        ))}
        {!tasks.length ? <div className="glass-card"><h2>No paid tasks yet</h2><p>Paid tasks will appear here from confirmed on-chain records.</p></div> : null}
      </section>
    </main>
  );
}
