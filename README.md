# AI-Driven MEXC Trading Bot

A complete fullstack MVP for an AI-driven trading bot for MEXC SOL/USDT futures with 50× leverage, running entirely on Microsoft Azure.

![License](https://img.shields.io/badge/license-ISC-blue)
![Next.js](https://img.shields.io/badge/Next.js-16.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![Azure](https://img.shields.io/badge/Azure-Cloud-0078D4)

## 🚀 Features

- **AI-Driven Trading Strategies**: Automated trend-following, mean reversion, and breakout strategies
- **50x Leverage Support**: Trade SOL/USDT futures with up to 50x leverage on MEXC
- **Real-Time Dashboard**: Monitor trades, PnL, win rate, and active strategies
- **Secure API Key Storage**: AES-256 encrypted storage of MEXC API credentials
- **Position Management**: Automatic stop-loss and take-profit execution
- **Trade History & Logs**: Complete audit trail of all trading activity
- **Azure Cloud Native**: Fully deployed on Azure App Service with PostgreSQL

## 🏗️ Architecture

### Frontend
- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS with custom MEXC theme
- **Components**: React 19 with TypeScript
- **Deployment**: Azure App Service

### Backend
- **API**: Next.js API Routes (Node.js)
- **Trading Engine**: Custom strategy execution engine
- **MEXC Integration**: Direct API integration with signature authentication
- **Deployment**: Azure App Service

### Database
- **Platform**: Azure PostgreSQL Flexible Server
- **Features**: Encrypted API keys, strategies, trades, and logs
- **Schema**: Fully normalized with indexes for performance

## 📋 Prerequisites

- Node.js 18+ 
- Azure Account with active subscription
- MEXC Account with API keys (trading permissions, no withdrawal)
- Azure CLI (for deployment)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/malonitest/AIMEXCBot.git
   cd AIMEXCBot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   - `DATABASE_URL`: PostgreSQL connection string
   - `ENCRYPTION_KEY`: 32-character encryption key
   - `MEXC_API_URL`: MEXC API endpoint (default: https://contract.mexc.com)

4. **Setup database**
   
   Run the schema on your PostgreSQL database:
   ```bash
   psql $DATABASE_URL < lib/db/schema.sql
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000)

## 🌐 Azure Deployment

See detailed deployment guide in [azure-deploy.md](azure-deploy.md)

### Quick Deploy

```bash
# Build the application
npm run build

# Deploy to Azure (after configuring Azure CLI)
az webapp up --name aimexcbot-app --resource-group aimexcbot-rg
```

## 📊 Usage

### 1. Configure API Keys
- Navigate to Settings page
- Enter your MEXC API Key and Secret Key
- Keys are encrypted before storage

### 2. Create Trading Strategy
- Go to Strategies page
- Click "New Strategy"
- Configure:
  - Strategy name
  - Leverage (1-125x, default 50x)
  - Position size in USDT
  - Stop loss percentage
  - Take profit percentage
  - Strategy type (trend following, mean reversion, or breakout)

### 3. Activate Strategy
- Toggle strategy to "Active"
- Strategy will execute according to its parameters

### 4. Manual Execution (for testing)
- Go to Settings page
- Click "Execute Active Strategies"
- This simulates the automated execution that would run on a schedule

### 5. Monitor Performance
- Dashboard: View overall statistics
- Trade History: See all open and closed trades
- Trade Logs: Detailed execution logs for each trade

## 🔒 Security

- **Encrypted Storage**: All API keys are encrypted using AES-256
- **Environment Variables**: Sensitive data stored in Azure App Settings
- **HTTPS Only**: All traffic encrypted in transit
- **No Withdrawal Permissions**: API keys should only have trading permissions
- **IP Whitelist**: Recommended to whitelist Azure IPs on MEXC

## 📁 Project Structure

```
AIMEXCBot/
├── app/                      # Next.js app directory
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Dashboard page
│   ├── strategies/          # Strategies management
│   ├── trades/              # Trade history
│   └── settings/            # Settings page
├── components/              # React components
│   ├── Navigation.tsx       # Navigation bar
│   ├── DashboardStats.tsx   # Stats cards
│   ├── ActiveTrades.tsx     # Active positions
│   └── RecentTrades.tsx     # Closed trades
├── lib/                     # Core libraries
│   ├── db/                  # Database
│   │   ├── index.ts        # Connection pool
│   │   └── schema.sql      # Database schema
│   ├── mexc/               # MEXC API client
│   │   └── client.ts       # API integration
│   ├── strategy/           # Trading engine
│   │   └── engine.ts       # Strategy execution
│   └── encryption.ts       # Encryption utilities
├── pages/api/              # API routes
│   ├── settings/           # Settings API
│   ├── strategy/           # Strategy CRUD
│   └── trades/             # Trade data & logs
├── types/                  # TypeScript types
│   └── index.ts           # Type definitions
├── .azure/                # Azure configuration
├── azure-deploy.md        # Deployment guide
├── next.config.js         # Next.js config
├── tailwind.config.js     # Tailwind config
└── tsconfig.json          # TypeScript config
```

## 🧪 API Endpoints

### Settings
- `GET /api/settings` - Get API key status
- `POST /api/settings` - Save/update API keys

### Strategies
- `GET /api/strategy` - List all strategies
- `POST /api/strategy` - Create new strategy
- `PUT /api/strategy/[id]` - Update strategy
- `DELETE /api/strategy/[id]` - Delete strategy
- `POST /api/strategy/execute` - Execute active strategies

### Trades
- `GET /api/trades` - List trades (with filters)
- `GET /api/trades/stats` - Get trading statistics
- `GET /api/trades/logs` - Get trade logs

## 📈 Trading Strategies

### Trend Following (Implemented)
- Identifies market momentum
- Opens positions in the direction of the trend
- Configurable leverage and position sizing

### Mean Reversion (Planned)
- Identifies overbought/oversold conditions
- Trades against short-term price extremes

### Breakout (Planned)
- Detects support/resistance breakouts
- Enters positions on confirmed breaks

## ⚙️ Configuration

### Strategy Parameters
- **Leverage**: 1-125x (50x recommended for SOL/USDT)
- **Position Size**: USDT amount per trade
- **Stop Loss**: Percentage loss to trigger exit
- **Take Profit**: Percentage gain to trigger exit

### Risk Management
- Isolated margin mode (default)
- Automatic position sizing
- Built-in stop loss and take profit
- Real-time monitoring

## 🔄 Automated Execution

For production use, set up automated strategy execution:

### Option 1: Azure Functions (Recommended)
Create a Timer Trigger function that calls `/api/strategy/execute` every 5 minutes

### Option 2: Azure Logic Apps
Configure a recurrence trigger with HTTP action

### Option 3: External Cron Service
Use services like cron-job.org to trigger the API endpoint

## 📊 Monitoring

- **Application Insights**: Azure native monitoring
- **Database Logs**: Trade history and execution logs
- **Real-time Dashboard**: Live performance metrics

## 🐛 Troubleshooting

### Database Connection Issues
- Verify connection string format
- Check firewall rules in Azure PostgreSQL
- Ensure SSL mode is set to 'require'

### API Key Errors
- Verify API keys are correctly configured on MEXC
- Check API key permissions (needs futures trading)
- Ensure IP whitelist includes Azure IPs

### Strategy Not Executing
- Verify strategy is set to "Active"
- Check API key configuration
- Review trade logs for errors

## 🤝 Contributing

This is an MVP project. Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## ⚠️ Disclaimer

**Trading cryptocurrencies and futures involves significant risk. This bot is provided as-is with no guarantees. Use at your own risk. Never invest more than you can afford to lose.**

- Past performance does not guarantee future results
- High leverage increases both potential gains and losses
- Always test with small amounts first
- Monitor your positions regularly
- Understand the risks of automated trading

## 📄 License

ISC License - see LICENSE file for details

## 🔗 Links

- [MEXC Exchange](https://www.mexc.com/)
- [MEXC API Documentation](https://mxcdevelop.github.io/apidocs/contract_v1_en/)
- [Azure Documentation](https://docs.microsoft.com/azure/)
- [Next.js Documentation](https://nextjs.org/docs)

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check the Azure deployment guide
- Review MEXC API documentation

---

**Built with ❤️ for the crypto trading community**