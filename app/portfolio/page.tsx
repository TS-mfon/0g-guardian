import { SiteNav } from "@/components/SiteNav";
import { WalletConnect } from "@/components/WalletConnect";

export default function PortfolioPage() {
  return (
    <main>
      <SiteNav />
      <section className="page-hero">
        <span className="section-kicker">Portfolio</span>
        <h1>Your agents, keys, tasks, and revenue.</h1>
        <p>
          Connect a wallet to use the on-chain contract actions: launch agents, buy keys,
          create paid tasks, and claim creator revenue.
        </p>
      </section>
      <WalletConnect />
      <section className="portfolio-grid">
        <div><span>Agents launched</span><strong>Connect wallet</strong><p>Your created agents will appear from confirmed 0G Chain activity.</p></div>
        <div><span>Keys owned</span><strong>Connect wallet</strong><p>Track positions in agents you support or use.</p></div>
        <div><span>Revenue available</span><strong>Connect wallet</strong><p>Claim creator revenue from tasks and key activity.</p></div>
      </section>
    </main>
  );
}
