# Azure Deployment Guide

This guide explains how to deploy the AI-driven MEXC Trading Bot to Microsoft Azure.

## Prerequisites

1. Azure Account with active subscription
2. Azure CLI installed (`az`)
3. Node.js 18+ installed
4. PostgreSQL client (optional, for database setup)

## Step 1: Create Azure Resources

### 1.1 Create Resource Group
```bash
az group create --name aimexcbot-rg --location eastus
```

### 1.2 Create PostgreSQL Flexible Server
```bash
az postgres flexible-server create \
  --resource-group aimexcbot-rg \
  --name aimexcbot-db \
  --location eastus \
  --admin-user dbadmin \
  --admin-password <YOUR_STRONG_PASSWORD> \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 14 \
  --public-access 0.0.0.0
```

### 1.3 Create Database
```bash
az postgres flexible-server db create \
  --resource-group aimexcbot-rg \
  --server-name aimexcbot-db \
  --database-name aimexcbot
```

### 1.4 Configure Firewall (Allow Azure Services)
```bash
az postgres flexible-server firewall-rule create \
  --resource-group aimexcbot-rg \
  --name aimexcbot-db \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

## Step 2: Initialize Database Schema

Connect to your PostgreSQL database and run the schema:

```bash
psql "host=aimexcbot-db.postgres.database.azure.com port=5432 dbname=aimexcbot user=dbadmin password=<YOUR_PASSWORD> sslmode=require" < lib/db/schema.sql
```

Or use Azure portal's Query editor.

## Step 3: Create App Service

### 3.1 Create App Service Plan
```bash
az appservice plan create \
  --name aimexcbot-plan \
  --resource-group aimexcbot-rg \
  --location eastus \
  --sku B1 \
  --is-linux
```

### 3.2 Create Web App
```bash
az webapp create \
  --resource-group aimexcbot-rg \
  --plan aimexcbot-plan \
  --name aimexcbot-app \
  --runtime "NODE:18-lts"
```

## Step 4: Configure Environment Variables

Set environment variables for your app:

```bash
# Database Connection
az webapp config appsettings set \
  --resource-group aimexcbot-rg \
  --name aimexcbot-app \
  --settings DATABASE_URL="postgresql://dbadmin:<PASSWORD>@aimexcbot-db.postgres.database.azure.com:5432/aimexcbot?sslmode=require"

# Encryption Key (generate a secure 32-character key)
az webapp config appsettings set \
  --resource-group aimexcbot-rg \
  --name aimexcbot-app \
  --settings ENCRYPTION_KEY="<YOUR_32_CHAR_ENCRYPTION_KEY>"

# MEXC API URL
az webapp config appsettings set \
  --resource-group aimexcbot-rg \
  --name aimexcbot-app \
  --settings MEXC_API_URL="https://contract.mexc.com"

# Node Environment
az webapp config appsettings set \
  --resource-group aimexcbot-rg \
  --name aimexcbot-app \
  --settings NODE_ENV="production"

# App URL
az webapp config appsettings set \
  --resource-group aimexcbot-rg \
  --name aimexcbot-app \
  --settings NEXT_PUBLIC_APP_URL="https://aimexcbot-app.azurewebsites.net"
```

## Step 5: Deploy Application

### Option A: Deploy from Local Git

```bash
# Configure local git deployment
az webapp deployment source config-local-git \
  --resource-group aimexcbot-rg \
  --name aimexcbot-app

# Get deployment credentials
az webapp deployment list-publishing-credentials \
  --resource-group aimexcbot-rg \
  --name aimexcbot-app \
  --query "{username:publishingUserName, password:publishingPassword}"

# Add Azure remote
git remote add azure <GIT_URL_FROM_PREVIOUS_COMMAND>

# Deploy
npm run build
git push azure main:master
```

### Option B: Deploy from GitHub Actions

Create `.github/workflows/azure-deploy.yml`:

```yaml
name: Deploy to Azure

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm install
    
    - name: Build
      run: npm run build
    
    - name: Deploy to Azure
      uses: azure/webapps-deploy@v2
      with:
        app-name: aimexcbot-app
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
```

### Option C: Deploy via Azure CLI

```bash
# Build the application
npm run build

# Create deployment package
zip -r deploy.zip .next node_modules package.json next.config.js public

# Deploy
az webapp deployment source config-zip \
  --resource-group aimexcbot-rg \
  --name aimexcbot-app \
  --src deploy.zip
```

## Step 6: Configure Startup Command

```bash
az webapp config set \
  --resource-group aimexcbot-rg \
  --name aimexcbot-app \
  --startup-file "npm start"
```

## Step 7: Setup Automated Strategy Execution (Optional)

To run strategies automatically, set up Azure Functions or a WebJob:

### Using Azure Functions (Recommended)

1. Create a Timer Trigger Function
2. Call your `/api/strategy/execute` endpoint periodically
3. Configure to run every 5 minutes or as needed

Example Function code:
```javascript
module.exports = async function (context, myTimer) {
    const axios = require('axios');
    
    try {
        const response = await axios.post(
            'https://aimexcbot-app.azurewebsites.net/api/strategy/execute'
        );
        context.log('Strategy execution result:', response.data);
    } catch (error) {
        context.log.error('Strategy execution failed:', error);
    }
};
```

## Step 8: Verify Deployment

Visit your app at: `https://aimexcbot-app.azurewebsites.net`

## Step 9: Setup SSL/Custom Domain (Optional)

```bash
# Add custom domain
az webapp config hostname add \
  --resource-group aimexcbot-rg \
  --webapp-name aimexcbot-app \
  --hostname yourdomain.com

# Enable SSL
az webapp config ssl bind \
  --resource-group aimexcbot-rg \
  --name aimexcbot-app \
  --certificate-thumbprint <THUMBPRINT> \
  --ssl-type SNI
```

## Monitoring and Logs

### View Logs
```bash
az webapp log tail \
  --resource-group aimexcbot-rg \
  --name aimexcbot-app
```

### Enable Application Insights
```bash
az monitor app-insights component create \
  --app aimexcbot-insights \
  --location eastus \
  --resource-group aimexcbot-rg

# Link to Web App
az webapp config appsettings set \
  --resource-group aimexcbot-rg \
  --name aimexcbot-app \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY="<INSTRUMENTATION_KEY>"
```

## Cost Estimation

- **App Service (B1)**: ~$13/month
- **PostgreSQL (Standard_B1ms)**: ~$12/month
- **Storage**: ~$1-5/month
- **Total**: ~$26-30/month

## Security Best Practices

1. **Never commit secrets** - Use Azure Key Vault or App Settings
2. **Enable HTTPS only** - Force SSL in App Service
3. **Configure IP restrictions** - Limit access to known IPs
4. **Enable Azure AD authentication** - For admin access
5. **Regular backups** - Enable automated backups for database
6. **Monitoring** - Set up alerts for errors and anomalies

## Troubleshooting

### Application won't start
- Check logs: `az webapp log tail`
- Verify environment variables are set
- Check database connection string

### Database connection issues
- Verify firewall rules allow App Service
- Check connection string format
- Ensure SSL mode is set to 'require'

### Build fails
- Verify Node.js version compatibility
- Check package.json scripts
- Review build logs in deployment center

## Support

For issues, refer to:
- [Azure App Service Documentation](https://docs.microsoft.com/azure/app-service/)
- [Azure PostgreSQL Documentation](https://docs.microsoft.com/azure/postgresql/)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
