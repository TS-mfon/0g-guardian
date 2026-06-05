import { DocsPanel, DocsShell } from "@/components/DocsShell";

export default function ComputeDocsPage() {
  return (
    <DocsShell title="0G Compute integration" intro="Creators activate compute so users can pay for real task execution.">
      <DocsPanel kicker="Activation" title="Creator-funded execution">
        <p>Creators pick a compatible model, sign ledger/provider funding through the 0G Compute broker, pay the protocol activation fee, and let the app store an encrypted provider token for paid task execution.</p>
      </DocsPanel>
    </DocsShell>
  );
}
