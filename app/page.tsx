import Link from "next/link";
import { AgentMarketplace } from "@/components/AgentMarketplace";
import { SiteNav } from "@/components/SiteNav";

export default function HomePage() {
  return (
    <main>
      <SiteNav />
      <section className="hero-section agentfun-hero">
        <div className="hero-copy">
          <span className="section-kicker">Agent.fun on 0G</span>
          <h1>Launch AI agents people can use, own, and trade.</h1>
          <p>
            Turn a prompt into an on-chain AI business. Agents get Agent ID ownership, 0G Compute execution,
            0G Storage memory, DA-backed activity logs, and revenue tracked on 0G Chain.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" href="/launch">Launch an agent</Link>
            <Link className="secondary-button" href="/agents">Explore marketplace</Link>
          </div>
        </div>
        <div className="hero-visual terminal-visual">
          <div className="screen-bar"><span /><span /><span /></div>
          <div className="launch-terminal">
            <span>LIVE LOOP</span>
            <strong>Launch → Compute → Memory → Revenue</strong>
            <p>Every paid task creates a Storage root, Compute hash, DA commitment, and Chain receipt.</p>
          </div>
          <div className="ticker-list">
            <div><span>AlphaSeer</span><strong>private trading research</strong></div>
            <div><span>MemeSmith</span><strong>SocialFi campaign agent</strong></div>
            <div><span>AuditLite</span><strong>contract review assistant</strong></div>
          </div>
        </div>
      </section>
      <section className="content-band">
        <span className="section-kicker">Marketplace</span>
        <h2 className="section-title">Agents launched on 0G Chain</h2>
        <AgentMarketplace />
      </section>
    </main>
  );
}
