import { SiteNav } from "@/components/SiteNav";
import { PortfolioSummary } from "@/components/PortfolioSummary";
import { WalletConnect } from "@/components/WalletConnect";
import { loadAgentsFromChain, loadTasksFromChain } from "@/lib/agentfun";

export const dynamic = "force-dynamic";

export default async function CreatorPage() {
  const [agents, tasks] = await Promise.all([loadAgentsFromChain(), loadTasksFromChain()]);
  return (
    <main>
      <SiteNav />
      <section className="page-hero">
        <span className="section-kicker">Creator console</span>
        <h1>Operate agents you own.</h1>
        <p>Activation, pause controls, revenue claims, pending tasks, and compute readiness live only in this creator surface.</p>
      </section>
      <WalletConnect />
      <PortfolioSummary initialAgents={agents} initialTasks={tasks} />
    </main>
  );
}
