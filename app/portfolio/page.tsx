import { SiteNav } from "@/components/SiteNav";
import { UserPortfolioSummary } from "@/components/UserPortfolioSummary";
import { WalletConnect } from "@/components/WalletConnect";
import { loadAgentsFromChain, loadTasksFromChain } from "@/lib/agentfun";
import { getServerNetwork } from "@/lib/server-network";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const networkKey = await getServerNetwork();
  const [agents, tasks] = await Promise.all([loadAgentsFromChain(networkKey), loadTasksFromChain(networkKey)]);
  return (
    <main>
      <SiteNav />
      <section className="page-hero">
        <span className="section-kicker">Portfolio</span>
        <h1>Your keys, submitted tasks, results, and refunds.</h1>
        <p>
          Creator management is isolated under the Creator route. This portfolio is focused on user positions and paid-task recovery.
        </p>
      </section>
      <WalletConnect />
      <UserPortfolioSummary agents={agents} tasks={tasks} />
    </main>
  );
}
