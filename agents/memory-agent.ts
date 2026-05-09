import { genesisTemplates } from "../lib/agent-templates";

const demo = {
  workflow: "RunAgentTaskWorkflow",
  steps: [
    "verify task payment on 0G Chain",
    "load metadata and memory from 0G Storage",
    "run 0G Compute",
    "upload result and new memory to 0G Storage",
    "submit DA commitment",
    "complete task on 0G Chain"
  ],
  firstGenesisAgent: genesisTemplates[0]
};

console.log(JSON.stringify(demo, null, 2));
