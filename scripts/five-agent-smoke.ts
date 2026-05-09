import { genesisTemplates } from "../lib/agent-templates";

console.log(JSON.stringify({
  ok: true,
  product: "Agent.fun on 0G",
  genesisAgents: genesisTemplates.map((agent) => ({
    name: agent.name,
    symbol: agent.symbol,
    category: agent.category
  }))
}, null, 2));
