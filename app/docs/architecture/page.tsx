import { DocsPanel, DocsShell } from "@/components/DocsShell";

export default function ArchitectureDocsPage() {
  return (
    <DocsShell title="System architecture" intro="The boundary between wallet actions, network-specific contracts, Storage, Compute, and settlement.">
      <DocsPanel kicker="Map" title="On-chain and off-chain boundaries">
        <pre>{`Wallet -> Next.js UI -> 0G Storage uploads
Wallet -> Agent ID mint -> AgentFunCoreV2 launch
Creator wallet -> AgentFunCoreV2 activation
User wallet -> live quote -> task escrow
Executor -> real metadata from 0G Storage -> 0G Compute
Executor -> result/memory to 0G Storage -> AgentFunCoreV2 settlement`}</pre>
      </DocsPanel>
    </DocsShell>
  );
}
