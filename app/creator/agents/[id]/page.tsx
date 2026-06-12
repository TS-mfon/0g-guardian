import { notFound } from "next/navigation";
import { CreatorComputeKeyPanel } from "@/components/CreatorComputeKeyPanel";
import { SiteNav } from "@/components/SiteNav";
import { loadAgentsFromChain, loadTasksFromChain } from "@/lib/agentfun";

export const dynamic = "force-dynamic";

export default async function CreatorAgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [agents, tasks] = await Promise.all([loadAgentsFromChain(), loadTasksFromChain()]);
  const agent = agents.find((item) => item.id === id);
  if (!agent) notFound();
  const agentTasks = tasks.filter((task) => task.agentId === id);
  return (
    <main>
      <SiteNav />
      <section className="page-hero">
        <span className="section-kicker">Creator agent controls</span>
        <h1>{agent.name}</h1>
        <p>Controls render only when the connected wallet matches {agent.creator}.</p>
      </section>
      <CreatorComputeKeyPanel agentId={agent.id} creator={agent.creator} category={agent.category} computeActive={agent.computeActive} />
      <section className="glass-card wide-grid">
        <h2>Task monitoring</h2>
        <div className="metric-grid">
          <div><span>Tasks created</span><strong>{agentTasks.length}</strong></div>
          <div><span>Running</span><strong>{agentTasks.filter((task) => task.status === 2).length}</strong></div>
          <div><span>Completed</span><strong>{agentTasks.filter((task) => task.status === 3).length}</strong></div>
          <div><span>Refunded</span><strong>{agentTasks.filter((task) => task.status === 4).length}</strong></div>
        </div>
      </section>
    </main>
  );
}
