# 0G Guardian

0G Guardian lets users run AI guard agents before signing transactions, then persist review evidence through 0G infrastructure.

## What It Does

0G Guardian is a no-backend agentic firewall for wallet actions. Users pick a specialized guardian agent, review a transaction intent, inspect a plain-English risk result, and prepare proof material for 0G Storage, 0G DA, and 0G Chain receipts.

The app now has separate pages for each function:

- `/` landing page
- `/for-users` user pitch
- `/for-developers` developer pitch
- `/agents` test guardian directory
- `/agents/[slug]` individual registered test agent pages
- `/register` guardian registration payload builder
- `/review` transaction review console
- `/proofs` deterministic proof material explorer

## Test Agents

The app includes three seeded test guardians so visitors do not land on empty or fake counters:

- DeFi Approval Sentinel
- Swap Slippage Guardian
- SocialFi Permission Guard

Each agent has its own page, policy, sample transaction, review output, and deterministic proof hashes.

## 0G Integration

- `GuardianRegistry` and `ProtectionReceipt` contracts are included for 0G Chain.
- Browser SDK helpers are included for 0G Storage uploads.
- The review page supports the 0G Compute OpenAI-compatible route when a browser-only API key is provided.
- DA proof material is modeled through deterministic commitments and the `npm run da:submit` helper.
- Agent ID token ids are attached to each guardian profile.

## Local Development

```bash
npm install
cp .env.example .env.local
npm run test:contracts
npm run build
npm run dev
```

## Deployment

Target GitHub repo:

```text
https://github.com/ts-mfon/0g-guardian
```

Target Vercel URL:

```text
https://0g-guardian.vercel.app
```

## Submission Copy

Project name: **0G Guardian**

One-sentence description:
**0G Guardian lets users run AI guard agents before signing transactions, then persist review evidence through 0G infrastructure.**

X post template:

```text
Introducing 0G Guardian for the #0GHackathon.

AI guard agents review wallet transactions before users sign, explain the risk, and prepare verifiable proof material with 0G.

#BuildOn0G
@0G_labs @0g_CN @0g_Eco @HackQuest_
```
