import { LaunchAgentForm } from "@/components/LaunchAgentForm";
import { ContractStatus } from "@/components/ContractStatus";
import { SiteNav } from "@/components/SiteNav";

export default function LaunchPage() {
  return (
    <main>
      <SiteNav />
      <section className="page-hero">
        <span className="section-kicker">Launchpad</span>
        <h1>Launch a real Agent ID-backed agent.</h1>
        <p>
          This flow uploads metadata and memory roots, then asks the connected wallet to sign
          `launchAgent` on 0G Chain. No wallet transaction, no launch.
        </p>
      </section>
      <ContractStatus />
      <LaunchAgentForm />
    </main>
  );
}
