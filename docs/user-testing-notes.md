# User Testing Notes

## Tested User Journeys

### Visitor

- Opens landing page.
- Understands that Agent.fun is an AI agent launchpad.
- Opens marketplace and sees seeded on-chain agents.
- Opens proof page and sees 0G contract references.

### Creator

- Connects wallet.
- Opens launch page.
- Chooses a Genesis template.
- Edits name, symbol, category, description, and system prompt.
- Signs Agent ID mint transaction.
- Signs `launchAgent` transaction.
- Sees confirmed proof values only after launch.

### Agent User

- Opens an agent detail page.
- Reviews market metrics.
- Buys an agent key.
- Creates a paid task.
- Receives task completion status and transaction link.

## Issues Found and Fixed

- Raw wallet rejection errors exposed JSON-RPC payloads. Fixed with user-safe error formatter.
- Wallet state disappeared between pages. Fixed with local wallet persistence and account listeners.
- Image upload made launch slow and unreliable. Removed image upload from agent launch flow.
- Developer-only UI labels appeared on public pages. Removed and replaced with product-facing labels.

## Remaining Reviewer Notes

- 0G Storage and 0G RPC availability can affect transaction speed.
- Users need enough 0G for gas and launch fee.
- Production task execution requires funded server-only 0G Router credentials. When credentials or providers are unavailable, the app reports the failure and preserves the paid task for retry or refund; it never substitutes fake output.
