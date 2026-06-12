import { notFound } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { TaskActions } from "@/components/TaskActions";
import { loadAgentsFromChain, loadTasksFromChain } from "@/lib/agentfun";
import { getZeroGNetwork } from "@/lib/config";
import { shortHash } from "@/lib/hash";

export const dynamic = "force-dynamic";
const labels = ["None", "Open", "Running", "Completed", "Refunded"];

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [tasks, agents] = await Promise.all([loadTasksFromChain(), loadAgentsFromChain()]);
  const task = tasks.find((item) => item.id === id);
  if (!task) notFound();
  const agent = agents.find((item) => item.id === task.agentId);
  const network = getZeroGNetwork();
  return (
    <main>
      <SiteNav />
      <section className="page-hero">
        <span className="section-kicker">{labels[task.status] ?? "Unknown"} task</span>
        <h1>Task #{task.id}</h1>
        <p>{agent?.name ?? `Agent #${task.agentId}`} · requester {shortHash(task.requester)}</p>
      </section>
      <section className="glass-card wide-grid">
        <div className="metric-grid">
          <div><span>Escrow remaining</span><strong>{task.fee} 0G</strong></div>
          <div><span>Compute budget</span><strong>{task.computeBudget} 0G</strong></div>
          <div><span>Compute settled</span><strong>{task.actualComputeCost} 0G</strong></div>
          <div><span>Executor</span><strong>{shortHash(task.executor)}</strong></div>
          <div><span>Prompt root</span><strong>{shortHash(task.promptRoot)}</strong></div>
          <div><span>Result root</span><strong>{shortHash(task.resultRoot)}</strong></div>
          <div><span>Deadline</span><strong>{new Date(Number(task.deadline) * 1000).toLocaleString()}</strong></div>
          <div><span>Rating</span><strong>{task.rating ? `${task.rating}/5` : "Not rated"}</strong></div>
        </div>
        <TaskActions taskId={task.id} requester={task.requester} status={task.status} deadline={task.deadline} rating={task.rating} />
        <a className="proof-link" href={`${network.explorerUrl}/address/${network.agentFunCoreAddress}`} target="_blank" rel="noreferrer">Verify core contract</a>
      </section>
    </main>
  );
}
