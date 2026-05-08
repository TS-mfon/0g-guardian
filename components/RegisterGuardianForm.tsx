"use client";

import { FormEvent, useState } from "react";
import { guardianAgents } from "@/lib/test-agents";
import { hashJson } from "@/lib/hash";

export function RegisterGuardianForm() {
  const [name, setName] = useState("Custom Treasury Guardian");
  const [tokenId, setTokenId] = useState("404");
  const [tags, setTags] = useState("treasury-review, policy-agent, 0g-storage");
  const [prompt, setPrompt] = useState("Review treasury transactions for abnormal recipients, high value, and policy violations.");
  const [preview, setPreview] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    setPreview(hashJson({ name, tokenId, tags, prompt, createdFrom: "0g-guardian-register" }));
  }

  return (
    <section className="split-layout">
      <form className="product-panel form-panel" onSubmit={submit}>
        <label>
          Agent name
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label>
          Agent ID token id
          <input value={tokenId} onChange={(event) => setTokenId(event.target.value)} />
        </label>
        <label>
          Capability tags
          <input value={tags} onChange={(event) => setTags(event.target.value)} />
        </label>
        <label>
          Guardian policy prompt
          <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} />
        </label>
        <button className="primary-button" type="submit">Build Registration Payload</button>
      </form>
      <aside className="product-panel result-panel">
        <span className="section-kicker">Registration preview</span>
        <h2>Prepare an Agent ID-linked guardian</h2>
        <p>This page builds the exact metadata payload that the app uploads to 0G Storage before registering the guardian on 0G Chain.</p>
        {preview ? <code>{preview}</code> : <p>Submit the form to generate a deterministic metadata hash.</p>}
        <h3>Existing test agents</h3>
        <ul className="clean-list">
          {guardianAgents.map((agent) => <li key={agent.slug}>{agent.name} · token {agent.agentTokenId}</li>)}
        </ul>
      </aside>
    </section>
  );
}
