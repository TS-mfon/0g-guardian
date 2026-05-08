"use client";

import { FormEvent, useState } from "react";
import { guardianAgents, verdictText } from "@/lib/test-agents";
import { reviewTransactionWith0GCompute } from "@/lib/compute-client";
import { hashJson } from "@/lib/hash";
import { clientConfig } from "@/lib/config";
import { TxIntent, txIntentSchema } from "@shared/index";
import { WalletConnect } from "./WalletConnect";

export function ReviewConsole() {
  const [selectedSlug, setSelectedSlug] = useState(guardianAgents[0].slug);
  const selectedAgent = guardianAgents.find((agent) => agent.slug === selectedSlug) ?? guardianAgents[0];
  const [target, setTarget] = useState(selectedAgent.sampleIntent.target);
  const [value, setValue] = useState(selectedAgent.sampleIntent.value);
  const [calldata, setCalldata] = useState(selectedAgent.sampleIntent.calldata);
  const [protocol, setProtocol] = useState(selectedAgent.sampleIntent.protocol);
  const [notes, setNotes] = useState(selectedAgent.sampleIntent.notes);
  const [apiKey, setApiKey] = useState("");
  const [result, setResult] = useState(selectedAgent.sampleReview);
  const [hashes, setHashes] = useState({
    txIntentHash: hashJson(selectedAgent.sampleIntent),
    computeHash: hashJson(selectedAgent.sampleReview)
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function loadAgent(slug: string) {
    const agent = guardianAgents.find((item) => item.slug === slug) ?? guardianAgents[0];
    setSelectedSlug(agent.slug);
    setTarget(agent.sampleIntent.target);
    setValue(agent.sampleIntent.value);
    setCalldata(agent.sampleIntent.calldata);
    setProtocol(agent.sampleIntent.protocol);
    setNotes(agent.sampleIntent.notes);
    setResult(agent.sampleReview);
    setHashes({ txIntentHash: hashJson(agent.sampleIntent), computeHash: hashJson(agent.sampleReview) });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const intent: TxIntent = txIntentSchema.parse({
        chainId: clientConfig.chainId,
        target,
        value,
        calldata,
        protocol,
        notes
      });
      const review = await reviewTransactionWith0GCompute({
        apiKey,
        baseUrl: clientConfig.computeBaseUrl,
        model: clientConfig.computeModel,
        guardianName: selectedAgent.name,
        policy: JSON.stringify(selectedAgent.policy),
        txIntent: intent
      });
      setResult(review);
      setHashes({ txIntentHash: hashJson(intent), computeHash: hashJson(review) });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
    <WalletConnect />
    <section className="split-layout">
      <form className="product-panel form-panel elevated-panel" onSubmit={submit}>
        <label>
          Guardian agent
          <select value={selectedSlug} onChange={(event) => loadAgent(event.target.value)}>
            {guardianAgents.map((agent) => <option key={agent.slug} value={agent.slug}>{agent.name}</option>)}
          </select>
        </label>
        <label>
          Target contract
          <input value={target} onChange={(event) => setTarget(event.target.value)} />
        </label>
        <div className="two-col">
          <label>
            Value
            <input value={value} onChange={(event) => setValue(event.target.value)} />
          </label>
          <label>
            Protocol
            <input value={protocol} onChange={(event) => setProtocol(event.target.value)} />
          </label>
        </div>
        <label>
          Calldata
          <textarea value={calldata} onChange={(event) => setCalldata(event.target.value)} />
        </label>
        <label>
          Notes
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
        <label>
          0G Compute API key, kept in browser memory
          <input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="Optional for local test mode" />
        </label>
        <button className="primary-button" type="submit" disabled={busy}>{busy ? "Reviewing..." : "Run Review"}</button>
        {error ? <p className="form-error">{error}</p> : null}
      </form>

      <aside className="product-panel result-panel elevated-panel">
        <span className="section-kicker">Result</span>
        <h2>{verdictText(result.verdict)} · {result.riskScore}/1000</h2>
        <p>{result.plainEnglishSummary}</p>
        <div className="risk-meter"><span style={{ width: `${Math.min(result.riskScore / 10, 100)}%` }} /></div>
        <h3>Detected risks</h3>
        <ul className="clean-list">
          {result.detectedRisks.map((risk) => <li key={risk}>{risk}</li>)}
        </ul>
        <h3>Proof material</h3>
        <div className="proof-lines">
          <code>{hashes.txIntentHash}</code>
          <code>{hashes.computeHash}</code>
        </div>
      </aside>
    </section>
    </>
  );
}
