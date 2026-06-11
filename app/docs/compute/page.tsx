import { DocsPanel, DocsShell } from "@/components/DocsShell";

export default function ComputeDocsPage() {
  return (
    <DocsShell title="0G Compute integration" intro="Creators activate agents once; users fund real inference through live network pricing.">
      <DocsPanel kicker="Activation" title="Simple creator activation">
        <p>Creators never paste provider keys or manage technical provider accounts. They sign one V2 activation transaction that seeds the compute treasury and enables paid tasks.</p>
      </DocsPanel>
      <DocsPanel kicker="User payment" title="Live task quotes and settlement">
        <p>Before payment, Agent.fun reads the selected model's live price, adds a bounded usage buffer, and escrows the service fee plus maximum compute budget. V2 limits settlement to that budget and refunds unused compute automatically.</p>
      </DocsPanel>
      <DocsPanel kicker="Network" title="0G Router model catalog">
        <p>Agent.fun reads the 0G Router model catalog on 0G Mainnet and enables only approved models with live providers. Launch is disabled when no recent verified catalog is available; unsupported static models are never silently advertised.</p>
      </DocsPanel>
      <DocsPanel kicker="Executor" title="Minimal secure execution service">
        <p>The Router spending key remains server-only. The executor runs already-paid tasks within their on-chain budget and submits completion receipts, while ownership, escrow, refunds, and revenue remain authoritative on 0G Chain.</p>
      </DocsPanel>
    </DocsShell>
  );
}
