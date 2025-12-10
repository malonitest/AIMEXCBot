# AIMEXCBot – AI Agent Field Guide

## Project Goals
- **Primary**: Fully automated SOL/USDT perpetual bot on MEXC delivering consistent daily/monthly profit with 50× leverage, 24/7 uptime, and strict drawdown limits.
- **Strategy**: Blend multi-timeframe trend read, orderbook imbalance AI, breakout confirmation, volatility clustering, adaptive risk, and ML probability layer (`probUp`/`probDown`) to improve win rate and filter noise.
- **Machine Learning**: Persist model inputs/outputs so the decision layer can be retrained; execute trades only when deterministic filters + ML confidence align.
- **Azure-First Ops**: Everything runs inside Azure (App Service + API, Function timer engine, PostgreSQL, Key Vault); GitHub Actions handles CI/CD.
- **Dashboard**: Real-time UI surfaces AI signal, open exposure, PnL windows, performance graphs, risk metrics, ML stats, and trade history for oversight.
- **Data Exhaust**: Log candles (1m/15s/1s), orderbook snapshots, trades, strategy decisions, and ML predictions to fuel future models.
- **Safety**: Encrypt credentials, enforce daily loss kill-switch, cooldown after large losses, guard against hyper-volatility/overtrading, log + alert every action.
- **Scalability**: Support compounding capital and unlock new markets (BTC/ETH) without architectural rewrites.
- **One-liner**: “Build a fully automated AI SOL/USDT futures system on MEXC to consistently make money using advanced strategy logic, ML predictions, and Azure-native automation.”

## Architecture Snapshot
- Next.js 14 app lives in `web/` (app router, Tailwind 4, SWR data fetching) while reusable trading logic stays in `lib/`. Keep domain logic in `lib/*` so both the web APIs and Azure Function can share it.
- `functions/runBot` is an Azure Functions timer (Node 18) compiled via `tsup`; it executes the same `buildSignal`, `buildRiskEnvelope`, and `MexcClient` logic used by the UI but with authenticated requests.
- Data persistence relies on Prisma (`prisma/schema.prisma`), Azure PostgreSQL, and helper calls in `lib/db.ts`. Always go through these helpers rather than instantiating new Prisma clients.

## Domain Rules & Patterns
- Strategy logic is deterministic: EMAs, orderbook imbalance, and deltas are calculated inside `lib/strategy.ts`. Modify indicators there rather than spreading TA math across components.
- Risk controls (`lib/risk.ts`) assume a single open position, 1.5% risk per trade, and 5% daily max drawdown. When adding new execution paths, call `evaluateRisk` before placing orders.
- Secrets: encryption helpers in `lib/keyVault.ts` require either `KEY_VAULT_URI` (preferred) or `LOCAL_ENCRYPTION_KEY` for local work. API keys are stored encrypted in Postgres and mirrored in Key Vault secrets named `mexc-api-(key|secret)-{user}`.
- External calls: use `MexcClient` for signed MEXC REST calls and `publicClient` for market-only reads. Do not hand-roll fetch logic; signing and error handling already live in `lib/mexcClient.ts`.

## Web App Conventions
- API routes under `web/src/app/api/*` are thin orchestrators: fetch market data via `publicClient`, access Prisma through `lib/db.ts`, and never import React components server-side.
- UI components reside in `web/src/components/**`; layout uses the `AppShell` wrapper and custom design tokens defined in `globals.css` (Space Grotesk + glassmorphism). Respect these tokens when building new views.
- Client data fetching uses SWR + `jsonFetcher`. Keep refresh intervals configurable (see `NEXT_PUBLIC_DASHBOARD_REFRESH_MS`).

## Azure Function Workflow
- `functions/package.json` scripts: `npm run build` bundles to `functions/dist`; `npm run start` runs `func start`. Remember to reinstall deps after clean builds because we don’t commit `node_modules`.
- The timer’s happy path: load settings → decrypt credentials → fetch candles/orderbook → `buildSignal` → `evaluateRisk` → `recordTrade` + `appendStrategyLog`. When modifying this flow, keep logging via `appendStrategyLog` so the dashboard stays informative.

## Dev & Deployment Workflow
- Set env vars using `.env.example` + `functions/local.settings.sample.json`. Both the web app and function require `DATABASE_URL`, Key Vault IDs, and MEXC settings.
- Prisma workflow: `web` owns the CLI scripts (`npm run prisma:generate|migrate`). Run them from `web/` (or root with explicit `--schema prisma/schema.prisma`) so generated client stays in `/node_modules/.prisma/client`.
- CI/CD lives in `.github/workflows/web-deploy.yml` and `function-deploy.yml`. They expect secrets: DB URL, Key Vault info, MEXC vars, and Azure publish profiles. Mirror any new env var additions here.

## Debugging Tips
- Use `/api/status` to sanity-check signal outputs without touching the bot; it calls `publicClient` only. If values diverge from the function, inspect Key Vault creds or `DEFAULT_USER_ID` mismatches.
- Strategy/risk behavior is logged via `strategyLog` table. Query it through Prisma Studio (`npm run prisma:studio`) before touching logging logic.

Let me know if any part of this playbook is unclear or missing details so we can iterate.
