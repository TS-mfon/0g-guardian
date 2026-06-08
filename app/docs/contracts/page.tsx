import { zeroGNetworks, clientConfig } from "@/lib/config";
import { DocsPanel, DocsShell } from "@/components/DocsShell";

export default function ContractsDocsPage() {
  return (
    <DocsShell title="Contracts and proof links" intro="Current Agent.fun contracts deployed on 0G Mainnet.">
      <DocsPanel kicker="Addresses" title="Deployed contracts">
        <div className="receipt-card">
          <div className="receipt-row"><span>Mainnet core</span><strong>{zeroGNetworks.mainnet.agentFunCoreAddress}</strong></div>
          <div className="receipt-row"><span>Mainnet Agent ID</span><strong>{zeroGNetworks.mainnet.agentIdContractAddress}</strong></div>
          <div className="receipt-row"><span>Protocol wallet</span><strong>{clientConfig.protocolFeeWallet}</strong></div>
        </div>
      </DocsPanel>
    </DocsShell>
  );
}
