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
      <DocsPanel kicker="Networks" title="Router mainnet and discovered Galileo providers">
        <p>Mainnet uses the 0G Router model catalog. Galileo uses the read-only Compute SDK and only enables models advertised by acknowledged live providers.</p>
      </DocsPanel>
    </DocsShell>
  );
}
