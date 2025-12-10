# AIMEXCBot

AI-assisted SOL/USDT (50×) trading bot targeting the MEXC Futures Testnet. The system ships as a mono-repo with a Next.js command center, Prisma/PostgreSQL data layer, reusable trading libraries, and an Azure Functions timer job that fires every ~15 seconds to evaluate signals and place orders.

## Architecture

- **Web dashboard (`/web`)** – Next.js 14 + Tailwind CSS. Provides live signal visualizations, bot status, settings management (Key Vault–encrypted secrets), and trade telemetry.
- **Shared libraries (`/lib`)** – Strategy logic, risk engine, MEXC REST client, Prisma helpers, and Key Vault encryption utilities consumed by both the web APIs and Azure Functions.
- **Database (`/prisma`)** – Prisma schema targeting Azure Database for PostgreSQL Flexible Server. Stores encrypted API key blobs, strategy configs, trade history, and daily loss tracking.
- **Background execution (`/functions`)** – Azure Functions (Node 18) timer trigger that:
  1. Loads settings + decrypts credentials via Key Vault
  2. Pulls SOL/USDT futures data, builds AI-like momentum signal
  3. Evaluates risk (position sizing, daily loss guard, single-position rule)
  4. Sends signed futures orders to MEXC and persists trades/logs
- **CI/CD (`.github/workflows`)** – Separate GitHub Actions deploy pipelines for the Next.js App Service and the Function App.

## Prerequisites

- Node.js 20+
- PNPM/NPM (repo uses npm + lockfiles)
- Azure subscription with:
  - App Service (Linux) for the web dashboard
  - Azure Functions (Consumption or Premium) for `runBot`
  - Azure Database for PostgreSQL Flexible Server
  - Azure Key Vault (store `aimexcbot-encryption-key` >= 32-byte hex/base64 string and runtime secrets)
- MEXC Futures API key/secret (testnet recommended)

## Environment setup

1. **Install dependencies**
```bash
cd web && npm install && cd ..
cd functions && npm install && cd ..
```
2. **Copy env templates**
```bash
cp .env.example .env            # shared values (used by tooling)
cp functions/local.settings.sample.json functions/local.settings.json
```
3. **Set required variables**
- `DATABASE_URL` (PostgreSQL)
- `KEY_VAULT_URI`, `KV_ENCRYPTION_SECRET_NAME`
- `LOCAL_ENCRYPTION_KEY` (optional fallback for local dev)
- `DEFAULT_USER_ID`, `ACCOUNT_BALANCE`, `MAX_DAILY_LOSS_PCT`

4. **Generate Prisma client**
```bash
cd web && npm run prisma:generate && cd ..
cd functions && npm run prisma:generate && cd ..
```

5. **Apply migrations** (creates DB schema)
```bash
npx prisma migrate deploy --schema prisma/schema.prisma
```

## Local development

### Web dashboard

```bash
cd web
npm run dev
# http://localhost:3000
```

The dashboard polls `/api/status` every 10s, renders live indicators, exposes settings (Key Vault–encrypted secrets), and displays trade logs.

### Azure Function (timer)

```bash
cd functions
npm install          # if not already installed
npm run build
func start --javascript
```

The timer trigger uses `functions/local.settings.json` for env vars. Ensure PostgreSQL + Key Vault are reachable or configure `LOCAL_ENCRYPTION_KEY` for offline testing.

## Deployment

Two opinionated workflows are provided:

1. **`web-deploy.yml`** – Builds `/web`, runs lint + `next build`, then deploys to the App Service defined by `AZURE_WEBAPP_NAME` via `AZURE_WEBAPP_PUBLISH_PROFILE` secret.
2. **`function-deploy.yml`** – Builds `/functions` (tsup -> `dist`), prunes dev deps, and deploys to the Function App referenced by `AZURE_FUNCTIONAPP_NAME`/`AZURE_FUNCTIONAPP_PUBLISH_PROFILE`.

Both workflows expect the following repository secrets (set in Settings → Secrets):

- `DATABASE_URL`
- `KEY_VAULT_URI`
- `KV_ENCRYPTION_SECRET_NAME`
- `MEXC_BASE_URL`, `MEXC_SYMBOL`
- `ACCOUNT_BALANCE`, `MAX_DAILY_LOSS_PCT`, `DEFAULT_USER_ID`
- `AZURE_WEBAPP_NAME`, `AZURE_WEBAPP_PUBLISH_PROFILE`
- `AZURE_FUNCTIONAPP_NAME`, `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`

## Key Vault usage

- A 32-byte symmetric key (hex or base64) must reside in Key Vault under `KV_ENCRYPTION_SECRET_NAME` (defaults to `aimexcbot-encryption-key`).
- User-supplied MEXC API key/secret are encrypted client-side and stored in the DB, and the raw values are also mirrored into Key Vault secrets (`mexc-api-key-{user}`, `mexc-api-secret-{user}`). The Azure Function pulls/decrypts on every tick.

## Project scripts

- `web`:
  - `npm run dev` – Next.js dev server
  - `npm run build` – Production bundle
  - `npm run lint` / `npm run typecheck`
  - `npm run prisma:*` helpers against `../prisma/schema.prisma`
- `functions`:
  - `npm run build` – tsup build to `dist`
  - `npm run prisma:generate`
  - `npm run start` – build then `func start`

## Testing + observability

- Strategy + risk outputs can be validated via `/api/status` or the dashboard.
- `prisma.strategyLog` captures bot decisions (entry, exits, risk blocks, errors) and surfaces within Azure Monitor / App Insights if connected.
- Daily loss guard rails stored in `DailyLimit` ensure trading halts after 5% drawdown.

## Security checklist

- Always run the web app + function with managed identity for Key Vault access in Azure.
- Restrict PostgreSQL ingress to Azure services or private networking.
- Store final App Service / Function App secrets (MEXC credentials, DB URL, Key Vault IDs) as Azure app settings, not inside repo.

Happy trading! ⚡
