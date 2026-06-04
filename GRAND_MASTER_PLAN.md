# Agent.fun on 0G Grand Master Plan

Planning-only artifact. No implementation code is included here.

This plan is written for a repo that currently contains a Next.js App Router dApp, serverless API routes, a single Solidity `AgentFunCore` contract, a `MockAgentId` contract, 0G Storage upload helpers, compute and DA orchestration routes, Genesis agent templates, deployment scripts, and documentation. It is intentionally detailed enough to break into GitHub issues, milestones, acceptance tests, audit tickets, and deployment runbooks.

The requested 100000-line plan is not practical to paste into chat or maintain as a literal document. This file is the executable master plan: it can be expanded into 100000 lines by converting every checklist item into an issue, subtask, test case, audit note, rollout step, rollback step, backup step, monitor, and document task.

Required operating keywords used throughout: update, fix, errors, improve, optimize, refactor, test, audit, secure, scale, deploy, monitor, adopt, onboard, document, migrate, integrate, rollback, backup.

## Official 0G Research Basis

Use these sources as the basis for every update, fix, errors handling path, improve, optimize, refactor, test, audit, secure, scale, deploy, monitor, adopt, onboard, document, migrate, integrate, rollback, and backup decision:

- 0G main docs: https://docs.0g.ai/
- 0G Builder Hub docs index: https://build.0g.ai/documentation
- 0G Mainnet: https://docs.0g.ai/developer-hub/mainnet/mainnet-overview
- 0G Galileo Testnet: https://docs.0g.ai/developer-hub/testnet/testnet-overview
- 0G Compute overview: https://docs.0g.ai/developer-hub/building-on-0g/compute-network/overview
- 0G Compute inference: https://docs.0g.ai/developer-hub/building-on-0g/compute-network/inference
- 0G Storage SDK: https://docs.0g.ai/developer-hub/building-on-0g/storage/sdk
- 0G DA integration: https://docs.0g.ai/developer-hub/building-on-0g/da-integration
- 0G Chain contract deployment: https://docs.0g.ai/developer-hub/building-on-0g/contracts-on-0g/deploy-contracts
- Agentic ID overview: https://docs.0g.ai/developer-hub/building-on-0g/agentic-id/overview
- Agentic ID integration: https://docs.0g.ai/developer-hub/building-on-0g/agentic-id/integration
- ERC-7857: https://docs.0g.ai/developer-hub/building-on-0g/agentic-id/erc7857
- 0G Agent Skills: https://github.com/0gfoundation/0g-agent-skills
- 0G Compute Skills: https://github.com/0gfoundation/0g-compute-skills
- 0G Storage starter kit: https://github.com/0gfoundation/0g-storage-ts-starter-kit
- 0G DA client: https://github.com/0gfoundation/0g-da-client
- 0G Compute SDK / serving broker repo: https://github.com/0gfoundation/0g-compute-ts-sdk

Important source-backed findings:

- Mainnet network details are 0G Mainnet, chain ID 16661, RPC `https://evmrpc.0g.ai`, storage indexer `https://indexer-storage-turbo.0g.ai`, and ChainScan `https://chainscan.0g.ai`.
- Galileo testnet chain ID is 16602; testnet includes a DAEntrance address and a development RPC at `https://evmrpc-testnet.0g.ai`.
- 0G Compute has two integration paths: Router for server-side OpenAI-compatible inference with unified balance and failover, and Direct SDK for provider-level wallet-signed control.
- Current 0G Compute docs name `@0gfoundation/0g-compute-ts-sdk` for Direct SDK use; the older skills repo also references `@0glabs/0g-serving-broker`. The plan must migrate carefully and document which package is current in the repo at implementation time.
- 0G Storage SDK requires Merkle tree calculation before upload and supports proof-enabled download verification.
- 0G DA currently expects running a DA client node plus encoder/retriever integration; browser-only fake commitments are not acceptable production proofs.
- 0G Chain deployments should use EVM version `cancun`, and Foundry deployments can use `forge create --evm-version cancun`.
- ERC-7857/Agentic ID should protect encrypted metadata, support usage authorization, and handle transfer/clone flows through proof-backed metadata access updates.

## Current Local Repo Audit Snapshot

Files read:

- 72 in-scope files excluding `.git`, `node_modules`, `.next`, `contracts/out`, and `contracts/cache`.
- Approximate in-scope content read: 249925 characters and 7498 lines.

Stack:

- Next.js App Router.
- React.
- TypeScript.
- Ethers v6.
- Zod.
- 0G Storage TypeScript SDK.
- Solidity 0.8.26.
- Foundry config with `evm_version = "cancun"`.

Current app structure:

- Frontend routes: `/`, `/launch`, `/register`, `/agents`, `/agents/[slug]`, `/portfolio`, `/proofs`, `/developers`, `/arena`, plus compatibility pages.
- Serverless API routes: `/api/agent/generate-profile`, `/api/compute/run-agent`, `/api/storage/upload-json`, `/api/da/submit`.
- Contracts: `AgentFunCore.sol`, `MockAgentId.sol`.
- Scripts: deploy, seed mainnet agents, DA local commitment, smoke scripts.
- Docs: README, API, deployment, integration tutorial, pitch deck, user testing notes, inventory, remediation backlog, previous master plan.

Current verification state from prior scan:

- `npm run typecheck`: passed.
- `npm run build`: passed.
- `npm run agents:smoke`: passed.
- `npm run agent:demo`: passed.
- `npm audit`: remaining 3 high and 4 moderate advisories after reducing dependency surface.
- `npm run test:contracts`: blocked locally because `forge` is not installed or not on PATH.
- Secret pattern scan: no literal private key or mnemonic found; placeholders and private-key variable names exist as expected.

Current highest-risk findings:

- P0: `completeTask` trust model lets requester complete with arbitrary roots.
- P0: server-wallet storage upload route needs signed intent, quota, and rate limiting.
- P0: DA integration requires a real DA gateway or DA client; deterministic fallback must remain non-production.
- P0: Genesis seed script hashes local payloads instead of uploading real 0G Storage objects.
- P0: contract tests are blocked until Foundry is installed in CI and local dev docs.
- P1: monolithic `AgentFunCore` is acceptable for MVP but weaker for audit, scale, migrate, rollback, and backup.
- P1: O(n) key price loops do not scale.
- P1: no emergency pause, multisig, timelock, or role-separated executor model.
- P1: no real event indexer for marketplace, proof explorer, portfolio, and analytics.
- P1: no E2E wallet/proof tests.

## Target Product Definition

Agent.fun on 0G should become:

- A launchpad where creators launch AI agents with wallet-signed registration on 0G Chain.
- A market where users buy/sell agent keys through a safe bonding curve.
- A paid task product where users pay agents, compute runs through 0G Compute, results and memory are stored on 0G Storage, DA commitments are posted through real 0G DA, and final task evidence is committed on-chain.
- An Agentic ID/iNFT product where each agent has an ownership token and encrypted metadata strategy.
- A proof explorer where judges, users, and integrators can verify Chain, Storage, Compute, DA, and Agent ID evidence.
- A developer platform where other apps can integrate agents, SDK calls, task payments, and proof receipts.
- A growth loop where useful agents earn revenue, supporters trade keys, creators onboard quickly, and partners adopt the protocol.

## Master Architecture Plan

On-chain modules:

- `AgentLaunchpad`: launch records, creator, Agent ID token ID, metadata root, memory root, capability hash, active status.
- `AgentMarket`: bonding curve key balances, supply, reserve, protocol fee, creator fee, slippage checks.
- `AgentTaskEscrow`: task creation, paid task status, prompt root, result root, compute hash, DA commitment, deadline, cancellation, rating.
- `AgentRevenueVault`: creator revenue, supporter revenue, protocol revenue, claims, accounting events.
- `AgentIdAdapter`: official Agentic ID or ERC-7857-compatible fallback interface.
- `AccessControl/Pausable/Timelock`: protocol governance, emergency pause, deploy safety, rollback control.

Off-chain modules:

- Storage service: JSON upload/download, file upload, image upload, Merkle verification, storage proof link generation.
- Compute service: profile generation, agent task inference, memory summarization, quality scoring, optional TEE/sealed provider selection.
- DA service: payload builder, DA client/gateway submitter, commitment verification, retry queue, proof explorer records.
- Indexer service: contract event ingestion, reorg-safe backfill, marketplace cache, portfolio cache, proof feed.
- Monitoring service: API errors, RPC errors, storage spend, compute spend, DA latency, task stuck state, wallet rejection rate.

Frontend modules:

- Launch flow.
- Agent marketplace.
- Agent detail and task console.
- Key market widget.
- Portfolio.
- Proof explorer.
- Arena.
- Developer docs.
- Admin safety dashboard.

## 0G Compute Implementation Plan

Problems found:

- Current compute path is fetch-based and falls back when no key is set.
- No provider discovery, TEE verification selection, Direct SDK account management, or Router-vs-Direct strategy is documented in app behavior.
- No payment verification before compute for production.
- No memory summarization route exists as a first-class API.
- No sealed/private inference mode is enforced for trading agents.
- No compute cost monitoring, request timeout, retry policy, or token budget.
- No response signature/proof capture.

Fixes and improvements:

- Update compute architecture to support two modes:
  - Router mode for server-side inference using `https://router-api.0g.ai/v1`.
  - Direct SDK mode using the current official SDK package at implementation time, with provider discovery and wallet/sub-account handling.
- Fix product copy so Router mode is described as server-side OpenAI-compatible and Direct mode as provider-level control.
- Integrate provider discovery for Direct SDK:
  - list providers;
  - filter service type `chatbot`;
  - record model, provider address, verification mode, health, price;
  - prefer TEE-enabled services for trading agents.
- Improve profile generation:
  - prompt template by category;
  - sanitize output;
  - parse structured JSON;
  - store source model/provider;
  - store compute hash.
- Improve run-agent task flow:
  - verify task exists on-chain;
  - verify task is open;
  - verify fee paid;
  - verify prompt root matches submitted prompt;
  - load agent metadata from Storage by metadata root;
  - load memory by memory root;
  - call compute;
  - summarize memory;
  - upload result and memory;
  - submit DA;
  - complete task by authorized executor.
- Refactor compute route into workflow steps:
  - `verifyPayment`;
  - `loadAgentContext`;
  - `selectProvider`;
  - `runInference`;
  - `summarizeMemory`;
  - `hashResult`;
  - `storeResult`;
  - `submitDa`;
  - `completeTask`.
- Secure compute secrets:
  - never expose API keys to browser;
  - use KMS or hosting secrets;
  - use service wallet only for non-custodial compute operations;
  - monitor spend.

Error handling additions:

- Timeout errors return clean `0G Compute timed out. Please retry.`
- Provider unavailable errors trigger failover if Router mode is active.
- Insufficient compute balance errors are mapped to admin/operator action, not raw SDK output.
- TEE verification failure blocks private/trading agent completion.
- Prompt too large errors show max token guidance.
- Payment mismatch errors block compute execution.
- Result validation errors block storage and completion.

Optimization strategies:

- Cache provider catalog for short TTL.
- Cache agent metadata/memory fetches by root hash.
- Use category-specific shorter prompts.
- Use streaming only where UX needs it.
- Cap prompt size and transcript history.
- Store summaries, not full chat history, in agent memory.
- Batch leaderboard scoring.
- Use async job polling for text-to-image or long-running tasks.

Adoption tactics:

- Offer "fast mode" Router and "verified mode" Direct provider selection.
- Add visible TEE/private badge for trading agents.
- Let creators select category and compute profile.
- Publish developer examples for calling agents through the API.
- Add compute receipts to proof explorer.

Acceptance criteria:

- Test profile generation with valid and invalid category.
- Test paid task cannot run before on-chain payment.
- Test trading agent requires TEE/private-capable provider.
- Test compute provider failure returns clean errors.
- Test result root and compute hash are deterministic and stored.
- Test monitor dashboard shows compute latency, success, failure, and spend.

Rollout steps:

- Phase 1: document Router mode and keep current fetch path.
- Phase 2: add payment verification before compute.
- Phase 3: add memory summarization.
- Phase 4: integrate provider discovery or Direct SDK behind feature flag.
- Phase 5: require TEE/private mode for trading agents.
- Phase 6: add compute receipts and proof explorer details.
- Phase 7: deploy, monitor, rollback to Router mode if Direct SDK errors exceed threshold.

## 0G Storage Integration Plan

Problems found:

- Current storage route uses server wallet and validates schema/size, but has no signed upload intent, quota, or rate limit.
- Browser helper always goes through API; no direct wallet-signed browser upload path.
- No JSON download or proof verification route.
- No image upload route.
- Seed script uses local deterministic hashes, not real Storage uploads.
- No storage retry queue, spend monitor, or backup inventory.
- Existing dependency audit risk remains through storage SDK transitive packages.

Fixes and improvements:

- Update storage module to support:
  - JSON upload;
  - JSON download;
  - image upload;
  - binary upload;
  - Merkle root calculation;
  - proof-enabled download verification;
  - storage scan link generation;
  - root-to-schema registry.
- Fix server-wallet abuse:
  - require EIP-712 signed upload intent;
  - include purpose, wallet, agentId, taskId, maxBytes, nonce, expiration;
  - verify nonce server-side;
  - rate limit by wallet and IP;
  - enforce daily upload quota;
  - log spend.
- Improve schema validation:
  - add `AgentMetadata`, `AgentMemory`, `TaskPrompt`, `TaskResult`, `AgentImage`, `DaPayload` versions;
  - reject unknown schema versions;
  - enforce `app: "agent.fun"`;
  - include content type, byte size, createdAt, hash.
- Refactor storage service:
  - `storage/schema.ts`;
  - `storage/upload.ts`;
  - `storage/download.ts`;
  - `storage/verify.ts`;
  - `storage/links.ts`;
  - `storage/quota.ts`.
- Integrate real seed uploads:
  - build metadata JSON;
  - build memory JSON;
  - upload to 0G Storage;
  - mint/link Agent ID;
  - launch on-chain using actual roots.

Error handling additions:

- `413` for oversized JSON or image.
- `400` for schema validation errors.
- `401` for missing upload signature.
- `403` for invalid upload signature.
- `429` for quota or rate-limit errors.
- `502` for storage indexer errors.
- `503` for storage service unavailable.
- User copy: `0G Storage upload failed. Please retry.`

Optimization strategies:

- Use `MemData` for JSON to avoid temp files.
- Precompute Merkle root before upload.
- Deduplicate by root hash.
- Cache downloaded public metadata by root.
- Use image compression before upload.
- Use pagination for memory timelines.
- Store large transcripts separately from compact memory summaries.

Adoption tactics:

- Show proof receipt with storage roots after confirmed actions.
- Add storage-root copy button and StorageScan link.
- Add creator-friendly image upload.
- Add developer docs for metadata schema and root verification.

Acceptance criteria:

- Upload valid agent metadata returns 0G root and tx hash.
- Upload invalid schema fails cleanly.
- Download with proof verifies root.
- Seed script creates real storage roots.
- Storage route cannot be abused without signature.
- Storage spend is monitored.

Rollout steps:

- Phase 1: document current server-wallet path risk.
- Phase 2: add signed intent and rate limit.
- Phase 3: add download and verification.
- Phase 4: add image upload.
- Phase 5: migrate seed script to real uploads.
- Phase 6: deploy, monitor, backup root inventory, rollback API if upload errors spike.

## 0G DA Commitments Plan

Problems found:

- Current app has no full DA client integration.
- DA route rejects missing gateway, which is correct, but no gateway/client is provisioned.
- Local script creates deterministic commitments only, useful for non-production evidence but not real DA.
- Proof explorer does not show DA status, batch, tx, or retriever link.
- No retry queue for DA submit failures.

Fixes and improvements:

- Update DA architecture around real 0G DA:
  - run DA client node;
  - run or connect encoder;
  - connect retriever;
  - expose internal relay endpoint to Next API;
  - submit blobs through gRPC or relay;
  - validate returned commitment.
- Fix payload builder:
  - deterministic canonical JSON;
  - app, version, eventType;
  - agentId, taskId, sessionId;
  - actor;
  - storageRoot;
  - computeHash;
  - chainId;
  - contract address;
  - timestamp;
  - previous commitment for sequence.
- Improve proof explorer:
  - show DA mode;
  - show commitment;
  - show blob size;
  - show submit status;
  - show retriever status when available;
  - show chain tx that consumed commitment.
- Refactor DA into:
  - `da/payload.ts`;
  - `da/submit.ts`;
  - `da/verify.ts`;
  - `da/retry.ts`;
  - `da/links.ts`.

Error handling additions:

- Missing gateway/client returns clean 503.
- Invalid payload returns 400.
- Invalid commitment format returns 502.
- DA timeout creates retryable pending state, not fake completion.
- DA fee/balance errors alert operator.
- Retriever verification failure marks proof as unavailable.

Optimization strategies:

- Batch low-value chat/session commitments.
- Submit critical task completion commitments synchronously.
- Keep payloads compact and store large data in 0G Storage.
- Use retry with exponential backoff.
- Monitor DA latency, blob size, fee, and failure rate.

Adoption tactics:

- Add "DA-backed" badge only when live DA proof exists.
- Add judge-facing proof explorer filters.
- Publish API docs for DA payload shape.
- Add public examples of verifying DA payload against result root.

Acceptance criteria:

- Successful task produces live DA commitment.
- Missing DA gateway blocks completion.
- DA payload can be reconstructed from Storage and Chain records.
- Proof explorer distinguishes pending, failed, fallback, and live DA states.
- Monitor alert fires when DA failure rate exceeds threshold.

Rollout steps:

- Phase 1: keep deterministic local script explicitly non-production.
- Phase 2: deploy DA client/relay.
- Phase 3: connect API route to relay.
- Phase 4: add proof explorer state.
- Phase 5: enable DA-required task completion.
- Phase 6: monitor and rollback to "tasks pending DA" if relay fails.

## 0G Chain Contracts Plan

Problems found:

- Original plan names four contracts, but repo currently has one `AgentFunCore`.
- `completeTask` authorization is too broad.
- Bonding curve price loops are O(n).
- No `cancelExpiredTask` implementation.
- No task deadline.
- No authorized executor role.
- No pause.
- No multisig/timelock policy.
- No nonReentrant modifier.
- No separate revenue vault.
- No supporter revenue split.
- No protocol fee claim target controls.
- No closed-form gas optimization.
- No invariant/fuzz tests.
- No deployment verification automation.

Fixes and improvements:

- Update contract architecture in two safe steps:
  - Step A: harden monolith without changing external UX.
  - Step B: refactor into modules after tests protect behavior.
- Fix task completion:
  - creator or authorized executor only;
  - requester cannot complete unless explicitly authorized;
  - store executor address;
  - emit executor in `TaskCompleted`.
- Add task lifecycle:
  - `deadline`;
  - `cancelExpiredTask`;
  - requester refund on expiry;
  - creator/executor cannot complete after cancellation.
- Add market slippage and optimization:
  - `buyKeys(agentId, keysOut, maxPayment)`;
  - `sellKeys(agentId, keysIn, minOut)`;
  - closed-form price formulas;
  - max trade amount if needed.
- Add pause:
  - pause launch;
  - pause market;
  - pause task creation;
  - allow claims while paused unless exploit touches claims.
- Add roles:
  - owner/admin;
  - fee manager;
  - pauser;
  - executor manager;
  - protocol fee recipient.
- Add revenue vault:
  - pull payments;
  - supporter revenue;
  - creator revenue;
  - protocol revenue;
  - event-rich accounting.
- Add governance:
  - multisig owner;
  - timelock for fee changes;
  - emergency pause bypass with postmortem requirement.

Error handling additions:

- Custom errors for unauthorized executor, expired task, task not open, paused market, invalid slippage, fee too high, zero recipient, invalid deadline.
- Events for fee update, executor update, pause, unpause, cancellation, refund, revenue allocation, protocol claim.

Optimization strategies:

- Pack booleans and small integers where safe.
- Use closed-form arithmetic.
- Use events for historical queries, not large arrays if indexer is present.
- Consider removing `getAllAgentIds` and `getAllTaskIds` for production scale after indexer exists.
- Benchmark launch, buy, sell, create task, complete task, claim.

Adoption tactics:

- Keep MVP ABI stable until post-hackathon.
- Provide migration from monolith to modules.
- Publish verified contracts and ABI snippets.
- Provide SDK wrappers for launch/use/trade.

Acceptance criteria:

- Foundry tests pass.
- Fuzz tests pass.
- Slither high findings resolved or documented.
- Gas snapshots improve or remain bounded.
- Protocol owner is multisig in production.
- Emergency pause tested.
- Deployment verified on ChainScan.

Rollout steps:

- Phase 1: install Foundry in CI.
- Phase 2: add failing tests for current vulnerabilities.
- Phase 3: fix authorization and task expiry.
- Phase 4: add pause and nonReentrant.
- Phase 5: optimize curve.
- Phase 6: split contracts if justified.
- Phase 7: migrate, deploy, monitor, rollback through pause and frontend disable flags.

## Agent ID And ERC-7857 Integration Plan

Problems found:

- `MockAgentId` is not full ERC-7857.
- Agent metadata is not encrypted.
- No usage authorization flow.
- No clone/transfer metadata access proof.
- No official Agentic ID deployment address verification.
- Launch currently can mint an ID before launch; failed launch can orphan identity.

Fixes and improvements:

- Update adapter strategy:
  - define `IAgentIdAdapter`;
  - implement `MockAgentIdAdapter` for local;
  - implement `OfficialAgentIdAdapter` when official addresses and ABI are confirmed;
  - document fallback.
- Fix launch atomicity:
  - create a preflight plan;
  - upload metadata;
  - mint/link identity;
  - launch;
  - if launch fails, show orphan warning and recovery path;
  - ideally move to a single orchestrated contract or adapter where possible.
- Improve metadata privacy:
  - public metadata contains safe profile fields;
  - private metadata contains system prompt, memory key, private config;
  - encrypt private metadata for owner/executor;
  - store encrypted metadata root.
- Integrate usage authorization:
  - owner authorizes task executor;
  - executor can access required encrypted data;
  - proof explorer shows authorization event.
- Migrate to ERC-7857 concepts:
  - transfer requires metadata access update;
  - clone requires authorization;
  - usage rights can be granted without transfer;
  - proofs are preserved.

Error handling additions:

- Agent ID unavailable.
- Token already used.
- Token owner mismatch.
- Metadata encryption failed.
- Usage authorization denied.
- Official adapter unavailable; fallback mock active.

Optimization strategies:

- Cache `ownerOf` reads.
- Batch Agent ID reads in indexer.
- Keep public metadata small.
- Use encrypted private metadata only when needed.

Adoption tactics:

- "Own your agent" message for creators.
- Transferable agent ownership as a creator economy feature.
- Agent leasing or authorized usage as growth loop.
- Composite agents later using multiple Agent IDs.

Acceptance criteria:

- Every launched agent stores token ID.
- Duplicate token IDs rejected.
- Official adapter path documented.
- Mock path marked dev/hackathon fallback.
- Ownership transfer path has privacy rules.
- Proof explorer links Agent ID record.

Rollout steps:

- Phase 1: document mock limitation.
- Phase 2: add adapter interface.
- Phase 3: confirm official address/ABI.
- Phase 4: add encrypted metadata.
- Phase 5: add usage authorization.
- Phase 6: migrate existing mock IDs if needed.

## Codebase Audit Plan

Problems found by file group:

- Root config:
  - `.env.example`: good placeholders, needs KMS/multisig notes.
  - `deployment.env`: public deploy data, should not contain secrets.
  - `package.json`: scripts are useful, but Foundry prerequisite is undocumented in scripts.
  - `package-lock.json`: remaining audit advisories.
  - `tsconfig.json`: strict true, good; typecheck can race with build if run in parallel.
- Contracts:
  - `AgentFunCore.sol`: monolith, task authorization, O(n) curve, no pause.
  - `MockAgentId.sol`: local fallback only.
  - tests: useful but too narrow and blocked by missing forge.
  - `Test.sol`: minimal test shim.
- Frontend components:
  - `LaunchAgentForm.tsx`: no image upload, launch can orphan Agent ID, proof phases need more granularity.
  - `AgentTaskPanel.tsx`: reconstructs metadata instead of loading from storage, requester completes task.
  - `AgentActions.tsx`: tx hash copy raw, needs links and clean state.
  - `WalletConnect.tsx`: good base, needs accessibility and disconnect.
  - `AgentMarketplace.tsx`: direct chain reads, no pagination or images.
  - `PortfolioSummary.tsx`: not real portfolio yet.
  - `SiteNav.tsx`: acceptable, needs responsive polish.
- API routes:
  - storage route: validation added, needs signed intent/rate limits.
  - compute route: validation added, needs payment verification.
  - DA route: rejects missing gateway, needs live integration.
  - profile route: validation added, needs structured output parsing.
- Lib:
  - `wallet.ts`: needs typed EIP-1193 events and network fallback.
  - `storage-server.ts`: uses server wallet, needs KMS and quotas.
  - `storage-client.ts`: API-only; direct browser path optional.
  - `compute-client.ts`: fallback mode should be marked dev-only.
  - `da-client.ts`: fallback helper should be non-production only.
  - `errors.ts`: good start, expand cases.
  - `agentfun.ts`: direct reads, scale with indexer.
  - `config.ts`: add validation and env diagnostics.
  - `hash.ts`: canonical JSON helper useful; add tests.
  - `links.ts`: add testnet/mainnet-safe storage links.
  - `agent-templates.ts`: improve prompts and image placeholders.
- Scripts:
  - deploy script: private key from env, add dry-run and verification.
  - seed script: replace local hashes with Storage uploads.
  - da-submit script: label non-production.
  - smoke scripts: add CI checks.
- Docs:
  - README: update with current risks and proof flow.
  - API docs: add auth, limits, schemas.
  - Deployment docs: add rollback and backup.
  - Integration tutorial: align with official current SDK names.

Fixes and improvements:

- Create issue for every P0 file-specific finding.
- Keep docs and inventory current after each milestone.
- Add automated "repo audit" script to output files, scripts, dependencies, env keys, and tests.
- Add "known limitations" to README before deploy.

Acceptance criteria:

- Every file has an owner, purpose, risk rating, and test coverage status.
- Every public route has a schema.
- Every contract function has tests.
- Every script has dry-run and failure documentation.

## Backend And API Improvements Plan

Problems found:

- No persistent rate limiting.
- No auth for paid compute/storage.
- No on-chain payment verification.
- No durable retry queue.
- No structured logs.
- No API tests.
- No request ID correlation.
- No CORS policy review.

Fixes and improvements:

- Add API middleware:
  - request ID;
  - JSON size limit;
  - schema validation;
  - auth/signed intent;
  - rate limit;
  - structured error output.
- Add payment verification:
  - for compute run, verify task status and fee;
  - for storage upload, verify signed launch/task intent;
  - for DA submit, verify task context.
- Add retry queue:
  - compute jobs;
  - storage uploads;
  - DA submits;
  - on-chain completions.
- Add logs:
  - request ID;
  - route;
  - wallet;
  - agentId;
  - taskId;
  - root hash;
  - status;
  - latency;
  - no secrets.

Error handling additions:

- Clean JSON `{ error, requestId }`.
- Never return raw SDK stack traces.
- Map wallet, storage, compute, DA, RPC, and contract errors.
- Add operator-only diagnostic logs.

Optimization strategies:

- Cache chain reads.
- Cache root downloads.
- Use serverless edge only for light reads; use Node runtime for SDK routes.
- Avoid blocking long compute jobs on request lifecycle where not needed.

Acceptance criteria:

- API tests cover success and all major error paths.
- Rate limit works.
- Payment verification blocks unpaid compute.
- Logs allow tracing a failed task end-to-end.

## Frontend And UX Plan

Problems found:

- No image upload.
- Marketplace lacks uploaded images.
- Portfolio is not real.
- Proof explorer is shallow.
- Launch flow needs more precise stages.
- Mobile needs screenshot QA.
- Accessibility labels and keyboard states need audit.
- Error UX is improved but incomplete.

Fixes and improvements:

- Launch flow:
  - draft;
  - validate;
  - generate profile;
  - upload image;
  - upload metadata;
  - upload memory;
  - mint/link Agent ID;
  - sign launch;
  - confirm launch;
  - show proof receipt.
- Task flow:
  - upload prompt;
  - pay task;
  - compute pending;
  - storage pending;
  - DA pending;
  - completion pending;
  - proof receipt.
- Marketplace:
  - images;
  - pagination;
  - category tabs;
  - sort by real events;
  - no fake metrics.
- Agent page:
  - market widget;
  - task console;
  - memory timeline;
  - proof feed;
  - revenue stats;
  - owner controls.
- Accessibility:
  - labels for controls;
  - focus states;
  - keyboard navigation;
  - contrast;
  - no overlapping text;
  - reduced motion.

Error handling additions:

- Rejected wallet request.
- Rejected transaction.
- Wrong network.
- Insufficient funds.
- Storage upload failed.
- Compute unavailable.
- DA unavailable.
- Task expired.
- Agent inactive.
- Image too large or invalid type.

Optimization strategies:

- Lazy load marketplace cards.
- Use image dimensions/aspect ratios to avoid layout shift.
- Use server-rendered data for initial marketplace.
- Use optimistic pending states but never show fake proofs.

Adoption tactics:

- Launch templates.
- Proof receipt sharing.
- Creator dashboard.
- Agent category pages.
- Developer docs CTA.

Acceptance criteria:

- Mobile and desktop screenshots pass.
- No raw RPC errors are visible.
- No public fake proof appears.
- Wallet flows are understandable.
- Launch and task completion are traceable.

## Testing And QA Plan

Problems found:

- Foundry tests exist but cannot run locally without `forge`.
- No CI.
- No Playwright.
- No API tests.
- No fuzzing.
- No gas snapshots.
- No coverage.
- No visual regression.

Fixes and improvements:

- Update CI:
  - install Node;
  - `npm ci`;
  - `npm run typecheck`;
  - `npm run build`;
  - `npm audit`;
  - install Foundry;
  - `forge test --root contracts`;
  - `forge coverage`;
  - `forge snapshot`.
- Add contract tests:
  - launch valid;
  - launch invalid roots;
  - duplicate Agent ID;
  - buy/sell keys;
  - revenue split;
  - task create;
  - task complete;
  - unauthorized complete;
  - cancellation;
  - pause;
  - claim.
- Add fuzz/property tests:
  - pricing monotonicity;
  - reserve never negative;
  - balances match supply;
  - claims cannot exceed deposits;
  - duplicate Agent ID impossible.
- Add API tests:
  - invalid JSON;
  - oversized JSON;
  - invalid schema;
  - missing DA;
  - compute payment verification.
- Add E2E:
  - wallet connect;
  - wallet reject;
  - launch;
  - task;
  - marketplace;
  - proofs;
  - mobile.

Acceptance criteria:

- CI red on failed tests.
- Contract coverage target set.
- Critical paths covered.
- Gas deltas visible.
- Testnet smoke runs before production deploy.

## Security And Resilience Plan

Problems found:

- No multisig.
- No pause.
- No timelock.
- No KMS.
- No bug bounty.
- No incident runbook.
- No production secret-management document.
- No history secret scan.

Fixes and improvements:

- Secure keys:
  - deployer hot key only for deploy;
  - protocol owner multisig;
  - server wallet in KMS;
  - rotate keys;
  - no local plaintext in production.
- Secure contracts:
  - pause;
  - roles;
  - nonReentrant;
  - timelock;
  - slippage;
  - executor allowlist.
- Secure backend:
  - signed intents;
  - rate limits;
  - quotas;
  - structured logs;
  - no secret logging.
- Secure frontend:
  - no raw errors;
  - no dangerous HTML;
  - CSP;
  - wallet domain warnings.
- Audit:
  - npm audit;
  - Slither;
  - Foundry fuzz;
  - manual review;
  - external review before real funds.

Rollback and backup:

- Pause contracts.
- Disable task completion route.
- Roll back frontend deployment.
- Restore indexer from last checkpoint.
- Preserve all task and proof evidence.
- Publish incident notes.

Acceptance criteria:

- Multisig controls production admin.
- Secrets never committed.
- Incident drill completed.
- Critical alerts configured.

## Performance And Scalability Plan

Problems found:

- Direct array reads do not scale.
- O(n) pricing loops do not scale.
- No CDN/media strategy.
- No caching.
- No pagination.
- No provider failover plan.

Fixes and improvements:

- Optimize curve formulas.
- Add indexer.
- Add pagination.
- Add caching layer.
- Add root metadata cache.
- Add CDN for public images only.
- Add multiple RPC providers.
- Add DA retry queue.
- Add compute failover.

Acceptance criteria:

- Agents page remains fast at 10000 agents.
- Task proof page remains fast at 100000 tasks.
- Gas remains bounded for large key trades.
- RPC failover works.
- Monitoring detects latency regressions.

## Adoption And Growth Strategy

Problems found:

- No referral loop.
- No creator analytics.
- No SDK package.
- No DAO/governance.
- No retention metrics.
- No public launch playbook.

Fixes and improvements:

- Creator adoption:
  - templates;
  - image upload;
  - launch receipt;
  - creator revenue dashboard;
  - social share card.
- User adoption:
  - category discovery;
  - task examples;
  - proof badges;
  - key market explanation.
- Developer adoption:
  - SDK wrappers;
  - API docs;
  - event docs;
  - integration examples.
- Community growth:
  - Genesis agent quests;
  - arena;
  - leaderboard;
  - referral attribution;
  - partner agents.
- Governance:
  - multisig first;
  - DAO later;
  - agent owner voting later;
  - protocol changes through timelock.

Acceptance criteria:

- Track launch completion rate.
- Track task completion rate.
- Track repeat users.
- Track revenue.
- Track creators retained.
- Track developer integrations.

## Documentation And Compliance Plan

Problems found:

- README needs current limitations and official source-backed integration notes.
- API docs need auth, limits, schemas.
- Deployment docs need rollback and backup.
- Compliance is not documented.
- License review not complete.

Fixes and improvements:

- Update README:
  - overview;
  - architecture;
  - official 0G sources;
  - setup;
  - tests;
  - deploy;
  - proof flow;
  - limitations.
- Update API docs:
  - request/response schemas;
  - errors;
  - rate limits;
  - signed intent.
- Update developer docs:
  - contract calls;
  - ABI snippets;
  - event indexing;
  - storage verification;
  - compute workflow;
  - DA workflow.
- Compliance:
  - do not store sensitive personal data unencrypted;
  - add data deletion limitation notice for decentralized storage;
  - add terms for AI output;
  - add financial disclaimer for trading research agents;
  - assess securities implications of revenue/key mechanics;
  - assess GDPR and privacy obligations.

Acceptance criteria:

- Fresh contributor can onboard from docs.
- Judge can reproduce proof flow.
- User can understand risks.
- Compliance limitations are visible.

## File-Level Review Checklist

For each file below, create one review issue with update, fix, errors, improve, optimize, refactor, test, audit, secure, scale, deploy, monitor, adopt, onboard, document, migrate, integrate, rollback, backup fields.

- `.env.example`: document envs, remove ambiguity, add KMS notes.
- `.gitignore`: verify all secret and build outputs ignored.
- `deployment.env`: keep public only; never add secrets.
- `package.json`: add CI scripts, lint scripts, audit scripts.
- `package-lock.json`: monitor and update dependency advisories.
- `tsconfig.json`: keep strict; avoid build/typecheck race.
- `next.config.mjs`: add security headers/CSP plan.
- `contracts/foundry.toml`: preserve Cancun; add remappings if OZ is adopted.
- `contracts/src/AgentFunCore.sol`: P0 security and gas refactor.
- `contracts/src/MockAgentId.sol`: mark dev-only; replace with adapter.
- `contracts/test/AgentFunCore.t.sol`: expand coverage.
- `contracts/test/Test.sol`: replace with forge-std if available.
- `packages/shared/src/index.ts`: version ABIs and schemas.
- `lib/api.ts`: extend with auth/rate limit/request IDs.
- `lib/agentfun.ts`: migrate to indexer.
- `lib/agent-templates.ts`: improve prompts and images.
- `lib/compute-client.ts`: add provider selection/payment verification.
- `lib/config.ts`: validate envs and network presets.
- `lib/da-client.ts`: real DA integration only for production.
- `lib/errors.ts`: expand error normalization.
- `lib/hash.ts`: add tests and canonical JSON edge cases.
- `lib/links.ts`: add testnet/mainnet link support.
- `lib/storage-client.ts`: support image upload and signed intent.
- `lib/storage-server.ts`: KMS, quotas, retries, monitoring.
- `lib/wallet.ts`: disconnect, typed events, network fallback.
- `components/LaunchAgentForm.tsx`: image upload, staged proof receipt, orphan recovery.
- `components/AgentTaskPanel.tsx`: payment verification and executor flow.
- `components/AgentActions.tsx`: links, slippage, balances, errors.
- `components/AgentMarketplace.tsx`: images, pagination, indexed data.
- `components/PortfolioSummary.tsx`: real holdings and claims.
- `components/SiteNav.tsx`: responsive/a11y polish.
- `components/WalletConnect.tsx`: disconnect, wrong-chain UX, a11y.
- `app/page.tsx`: stronger proof-backed pitch.
- `app/launch/page.tsx`: route-specific metadata and UX.
- `app/register/page.tsx`: decide if alias or remove.
- `app/agents/page.tsx`: marketplace filters.
- `app/agents/[slug]/page.tsx`: proof tabs and memory timeline.
- `app/portfolio/page.tsx`: real dashboard.
- `app/proofs/page.tsx`: real proof explorer.
- `app/developers/page.tsx`: SDK/API docs.
- `app/arena/page.tsx`: implement or mark coming soon.
- `app/styles.css`: design system, mobile, a11y, no overlap.
- `app/api/storage/upload-json/route.ts`: signed intent/rate limit.
- `app/api/compute/run-agent/route.ts`: payment verification.
- `app/api/agent/generate-profile/route.ts`: structured compute output.
- `app/api/da/submit/route.ts`: live DA client/relay.
- `scripts/deploy-mainnet.ts`: dry-run, verify, rollback docs.
- `scripts/seed-mainnet-agents.ts`: real storage uploads.
- `scripts/da-submit.ts`: non-production label or real client.
- `scripts/five-agent-smoke.ts`: expand smoke coverage.
- `agents/memory-agent.ts`: convert to executable workflow demo.
- `README.md`: update current truth and reproduction path.
- `docs/api.md`: schemas and errors.
- `docs/deployment.md`: deploy, monitor, rollback, backup.
- `docs/0g-integration-tutorial.md`: update official SDK naming.
- `docs/user-testing-notes.md`: add E2E checklist.
- `docs/pitch-deck.md`: align with proof-backed product.
- `docs/inventory.json`: regenerate after each milestone.
- `docs/remediation-backlog.json`: convert to issues.
- `docs/MASTER_PLAN.md`: keep concise executive version.
- `docs/GRAND_MASTER_PLAN.md`: keep exhaustive planning version.

## Priority Backlog

P0 before public real-money use:

1. Install Foundry in CI and local docs; run tests.
2. Add tests proving current `completeTask` requester issue.
3. Fix `completeTask` executor authorization.
4. Add task deadline and cancellation.
5. Add signed intent/rate limit/quota for storage.
6. Integrate real DA gateway/client.
7. Replace Genesis deterministic roots with real Storage uploads.
8. Resolve or risk-accept remaining high npm audit advisories.
9. Add multisig ownership plan.
10. Add production env and secret-management docs.

P1 before hackathon/judge demo:

1. Add image upload.
2. Add proof explorer task history.
3. Add event indexer MVP.
4. Add Playwright wallet/proof tests.
5. Add gas optimized bonding curve formulas.
6. Add pause and nonReentrant.
7. Add official Agent ID adapter or documented fallback.
8. Update README and docs.
9. Add deploy verification script.
10. Add monitoring dashboard.

P2 before beta:

1. Split contracts or establish stable module boundaries.
2. Add creator dashboard.
3. Add real portfolio.
4. Add SDK examples.
5. Add referral attribution.
6. Add arena.
7. Add accessibility audit.
8. Add localization plan.
9. Add bug bounty draft.
10. Add compliance review.

P3 after beta:

1. DAO governance.
2. Advanced supporter revenue.
3. Agent leasing.
4. Composite agents.
5. Trading/private agent TEE certification.
6. Partner integrations.
7. Multi-chain/L2 expansion.
8. Advanced analytics.
9. Public API keys and quotas.
10. Enterprise integrations.

## Two-Day Review Guide

Day 1 morning:

- Read official 0G research basis.
- Review current repo audit snapshot.
- Review P0 security findings.
- Review contracts plan.

Day 1 afternoon:

- Review Compute, Storage, DA, and Agent ID plans.
- Convert P0 items into issues.
- Confirm external dependencies and official SDK choices.

Day 2 morning:

- Review frontend, API, testing, security, and performance plans.
- Assign owners and acceptance criteria.
- Decide demo vs production scope.

Day 2 afternoon:

- Review adoption, docs, compliance, rollout, rollback, and backup.
- Create milestone board.
- Freeze P0 sprint.
- Begin implementation only after scope is accepted.

## Definition Of Ready For Implementation

- P0 scope accepted.
- Official SDK package names confirmed.
- DA gateway/client approach selected.
- Foundry installed.
- Secrets strategy selected.
- Multisig owner selected.
- Testnet target selected.
- Deployment envs documented.
- Rollback and backup process agreed.

## Definition Of Done For Production

- All P0 items complete.
- All P1 items complete or explicitly deferred.
- Typecheck, build, contract tests, fuzz tests, E2E tests, SCA, SAST, and secret scan pass.
- Live 0G Storage roots exist for Genesis agents.
- Live 0G Compute receipt exists for at least one task.
- Live 0G DA commitment exists for at least one task.
- Live 0G Chain task completion stores result root, compute hash, and DA commitment.
- Agent ID is official or clearly documented fallback.
- Proof explorer verifies all components.
- Multisig controls admin.
- Monitoring and alerts are live.
- Rollback drill completed.
- Backup inventory exported.
- Documentation lets a new user onboard, launch, use, verify, and adopt the dApp.
