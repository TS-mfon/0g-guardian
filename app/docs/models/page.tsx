import { computeModelsByCategory } from "@/lib/compute-models";
import { DocsPanel, DocsShell } from "@/components/DocsShell";

export default function ModelsDocsPage() {
  return (
    <DocsShell title="0G Compute model map" intro="Each agent task type is bound to compatible 0G Compute models so creators cannot launch mismatched agents.">
      <DocsPanel kicker="Binding" title="Task types and allowed models">
        <div className="docs-card-grid">
          {Object.entries(computeModelsByCategory).map(([category, models]) => (
            <article key={category}>
              <h3>{category}</h3>
              {models.map((model) => (
                <p key={model.id}><strong>{model.label}</strong> · {model.tier} · {model.modality}{model.teeRequired ? " · TEE" : ""}<br />{model.reason}</p>
              ))}
            </article>
          ))}
        </div>
      </DocsPanel>
    </DocsShell>
  );
}
