# Quick Setup Guide

This guide will help you get the AI-driven MEXC Trading Bot running quickly.

## Prerequisites

- Node.js 18 or higher
- PostgreSQL database (local or Azure)
- MEXC account with API keys

## Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database - Use your local PostgreSQL or Azure connection string
DATABASE_URL=postgresql://user:password@localhost:5432/aimexcbot

# Generate a secure 32-character encryption key
ENCRYPTION_KEY=your-32-char-encryption-key-here

# MEXC API URL (default is fine)
MEXC_API_URL=https://contract.mexc.com

# App configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Initialize Database

Run the database schema:

```bash
# Using psql
psql $DATABASE_URL < lib/db/schema.sql

# Or connect to your database and run the schema manually
```

Optional: Initialize with a test user:

```bash
node scripts/init-db.js
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## First Steps

1. **Configure API Keys**
   - Navigate to Settings page
   - Enter your MEXC API Key and Secret Key
   - Click "Save API Keys"

2. **Create a Strategy**
   - Go to Strategies page
   - Click "New Strategy"
   - Configure parameters:
     - Name: e.g., "SOL Trend Following"
     - Leverage: 50x (or adjust as needed)
     - Position Size: 100 USDT (start small)
     - Stop Loss: 2% (recommended)
     - Take Profit: 5% (recommended)
     - Strategy Type: Trend Following
   - Click "Create Strategy"

3. **Activate Strategy**
   - Toggle the strategy to "Active"

4. **Manual Execution (Testing)**
   - Go to Settings page
   - Click "Execute Active Strategies"
   - Monitor results in Dashboard and Trade History

## Production Deployment

For production deployment to Azure, see [azure-deploy.md](azure-deploy.md) for detailed instructions.

## Important Security Notes

### For MVP/Testing
- Uses hardcoded user ID (userId = 1)
- Fallback encryption key for testing

### For Production
You MUST:
1. Implement proper authentication (NextAuth.js recommended)
2. Set strong ENCRYPTION_KEY environment variable
3. Never commit API keys or secrets
4. Enable IP whitelist on MEXC
5. Use only trading permissions (no withdrawal)
6. Set up monitoring and alerts
7. Enable database backups
8. Use HTTPS only

## Trading Bot Features

### Supported Strategy Types

1. **Trend Following** (Implemented)
   - Follows market momentum
   - Enters positions in trend direction
   - Configurable leverage and position sizing

2. **Mean Reversion** (Planned)
   - Identifies overbought/oversold conditions
   - Counter-trend trading

3. **Breakout** (Planned)
   - Detects support/resistance breaks
   - Momentum-based entries

### Risk Management

- **Stop Loss**: Automatic exit at configured loss percentage
- **Take Profit**: Automatic exit at configured profit percentage
- **Position Sizing**: Fixed USDT amount per trade
- **Leverage Control**: Per-strategy leverage settings (1-125x)
- **Isolated Margin**: Each position is isolated to prevent liquidation

## Monitoring

- **Dashboard**: Real-time PnL, win rate, active trades
- **Trade History**: Complete audit trail with logs
- **Active Positions**: Monitor open trades in real-time

## Troubleshooting

### Database Connection Issues
```
Error: connect ECONNREFUSED
```
- Verify DATABASE_URL is correct
- Check PostgreSQL is running
- Verify firewall allows connections

### API Errors
```
Error: Failed to place order
```
- Check MEXC API keys are valid
- Verify API permissions include futures trading
- Check if IP is whitelisted on MEXC

### Build Errors
```
Module not found
```
- Run `npm install` again
- Delete `node_modules` and `.next` folders, then reinstall

## Support Resources

- [MEXC API Documentation](https://mxcdevelop.github.io/apidocs/contract_v1_en/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Azure App Service Docs](https://docs.microsoft.com/azure/app-service/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Disclaimer

**Trading cryptocurrency futures involves substantial risk of loss. This bot is provided for educational purposes. Use at your own risk. Never invest more than you can afford to lose.**

- Past performance does not guarantee future results
- High leverage amplifies both gains and losses
- Always test with small amounts first
- Monitor positions regularly
- Understand automated trading risks

## License

ISC License - See LICENSE file for details
