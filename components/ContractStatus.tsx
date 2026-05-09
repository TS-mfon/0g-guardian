import { clientConfig, isAddressConfigured } from "@/lib/config";

export function ContractStatus() {
  const coreReady = isAddressConfigured(clientConfig.agentFunCoreAddress);
  const agentIdReady = isAddressConfigured(clientConfig.agentIdContractAddress);

  return (
    <section className="contract-status">
      <div>
        <span className="section-kicker">Network readiness</span>
        <h2>{coreReady ? "Contracts wired to the frontend." : "Contracts pending deployment."}</h2>
        <p>
          Wallet actions call 0G Chain directly. Agent launches, key trades, paid tasks,
          and revenue claims become active when the deployed addresses are configured.
        </p>
      </div>
      <div className="contract-badges">
        <span className={coreReady ? "ready" : "pending"}>{coreReady ? "AgentFunCore ready" : "AgentFunCore pending"}</span>
        <span className={agentIdReady ? "ready" : "pending"}>{agentIdReady ? "Agent ID ready" : "Agent ID pending"}</span>
      </div>
    </section>
  );
}
