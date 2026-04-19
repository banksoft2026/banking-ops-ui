// Provisions an Azure App Service Plan (Linux B1) and a Node.js Web App.
// Run once per environment; idempotent on re-runs.
targetScope = 'resourceGroup'

@description('Azure region for all resources')
param location string = resourceGroup().location

@description('Application name prefix (lowercase, no spaces)')
param appName string = 'banking-ops'

@description('Deployment environment')
@allowed(['dev', 'staging', 'prod'])
param environment string = 'prod'

@description('User Administration service base URL')
param userAdminUrl string

@description('CBS Maintenance service base URL')
param cbsMaintenanceUrl string

@description('Account Master service base URL')
param accountMasterUrl string

@description('Transaction Posting service base URL')
param txnPostingUrl string

@description('Customer Entity service base URL')
param customerEntityUrl string

var prefix = '${appName}-${environment}'

// ── App Service Plan (Linux, Basic B1) ───────────────────────────────────────
resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: '${prefix}-plan'
  location: location
  sku: {
    name: 'B1'
    tier: 'Basic'
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

// ── Web App (Node 20 LTS) ─────────────────────────────────────────────────────
resource webApp 'Microsoft.Web/sites@2023-01-01' = {
  name: '${prefix}-ui'
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|20-lts'
      appCommandLine: 'node server.js'
      alwaysOn: true
      appSettings: [
        { name: 'NODE_ENV';                      value: 'production' }
        { name: 'WEBSITE_NODE_DEFAULT_VERSION';   value: '~20' }
        { name: 'USER_ADMIN_URL';                 value: userAdminUrl }
        { name: 'CBS_MAINTENANCE_URL';            value: cbsMaintenanceUrl }
        { name: 'ACCOUNT_MASTER_URL';             value: accountMasterUrl }
        { name: 'TXN_POSTING_URL';               value: txnPostingUrl }
        { name: 'CUSTOMER_ENTITY_URL';            value: customerEntityUrl }
      ]
    }
  }
}

output webAppUrl string = 'https://${webApp.properties.defaultHostName}'
output webAppName string = webApp.name
