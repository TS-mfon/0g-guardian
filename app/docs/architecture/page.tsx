import { DocsPanel, DocsShell } from "@/components/DocsShell";

export default function ArchitectureDocsPage() {
  return (
    <DocsShell title="System architecture" intro="The boundary between wallet actions, API executor routes, contracts, storage, compute, and optional DA.">
      <DocsPanel kicker="Map" title="On-chain and off-chain boundaries">
        <pre>{`Wallet -> Next.js UI -> 0G Storage uploads
Wallet -> Agent ID mint -> AgentFunCore launch
Wallet -> AgentFunCore key/task payments
API executor -> 0G Compute -> 0G Storage result/memory
API executor -> optional 0G DA -> AgentFunCore completeTask`}</pre>
      </DocsPanel>
    </DocsShell>
  );
}
