import { DocsPanel, DocsShell } from "@/components/DocsShell";

export default function DaDocsPage() {
  return (
    <DocsShell title="Why Agent.fun removed DA" intro="Agent.fun uses Chain, Storage, Compute, and Agent ID directly and does not operate a rollup.">
      <DocsPanel kicker="Architecture decision" title="No unnecessary DA dependency">
        <p>Storage roots and on-chain settlement provide the evidence Agent.fun needs. Mandatory DA previously created a task-completion failure point without improving correctness, so V2 removes it from the runtime.</p>
      </DocsPanel>
    </DocsShell>
  );
}
