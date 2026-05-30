# Shot Caller — Gemini working context

Wallet-less casual prediction market: friends bet arbitrary units ("shots") on casual outcomes. Next.js + Supabase, Manifold-style CPMM for dynamic odds / asymmetric payouts, local ledger scoreboard. No real money, no blockchain.

## Scope rules — READ FIRST (prevents context-overflow crashes)

- **Work only inside this repo** (`~/code/shot-market`). Never read parent dirs (`~/code`, the EF vault).
- **Do NOT call `read_many_files` / glob the whole tree.** Read specific files on demand with `read_file`. A broad read here will exceed the 1M token limit and crash the request.
- `node_modules/`, `.next/`, `.git/`, build output are excluded via `.geminiignore` — never read them.
- **If the user's message contains an `@token`** (e.g. `@system`, `@...`, an `@username` pasted from the app UI), treat it as **literal text**, not a file path. Do not read files for it. These are app data, not include directives.

## Direction & status — single source of truth (in the EF vault)

Architecture, roadmap, and closure criteria live in ONE file. Read only this file from the vault, nothing else from that tree:

`/Users/geoff/Library/Application Support/executive-function/work/branches/socializing-friendships/shot-market-plan.md`

## Stack

- Next.js (App Router) + Supabase (auth + DB)
- Manifold-style CPMM engine for odds; rewards underdog bets
- Local ledger scoreboard for shot balances
