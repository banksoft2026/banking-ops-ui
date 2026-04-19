// Main infrastructure template.
// Creates Log Analytics, Container Apps Environment, and the Container App.
// Run AFTER acr.bicep and after pushing the Docker image to ACR.
targetScope = 'resourceGroup'

@description('Azure region for all resources')
param location string = resourceGroup().location

@description('Application name prefix (lowercase, no spaces)')
param appName string = 'banking-ops'

@description('Deployment environment')
@allowed(['dev', 'staging', 'prod'])
param environment string = 'prod'

@description('Docker image tag to deploy (e.g. git commit SHA)')
param imageTag string = 'latest'

@description('Azure Container Registry name (without .azurecr.io)')
param acrName string

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

// ── Reference the ACR created by acr.bicep ───────────────────────────────────
resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' existing = {
  name: acrName
}

// ── Log Analytics Workspace ───────────────────────────────────────────────────
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: '${prefix}-logs'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// ── Container Apps Environment ────────────────────────────────────────────────
resource containerAppsEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: '${prefix}-env'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// ── Container App ─────────────────────────────────────────────────────────────
resource containerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: '${prefix}-ui'
  location: location
  properties: {
    managedEnvironmentId: containerAppsEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 80
        transport: 'http'
        allowInsecure: false
      }
      registries: [
        {
          server: acr.properties.loginServer
          username: acrName
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        {
          name: 'acr-password'
          value: acr.listCredentials().passwords[0].value
        }
      ]
    }
    template: {
      containers: [
        {
          name: '${appName}-ui'
          image: '${acr.properties.loginServer}/${appName}-ui:${imageTag}'
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            { name: 'USER_ADMIN_URL';      value: userAdminUrl }
            { name: 'CBS_MAINTENANCE_URL'; value: cbsMaintenanceUrl }
            { name: 'ACCOUNT_MASTER_URL';  value: accountMasterUrl }
            { name: 'TXN_POSTING_URL';     value: txnPostingUrl }
            { name: 'CUSTOMER_ENTITY_URL'; value: customerEntityUrl }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '50'
              }
            }
          }
        ]
      }
    }
  }
}

output containerAppUrl string = 'https://${containerApp.properties.configuration.ingress.fqdn}'
output containerAppName string = containerApp.name
output containerAppsEnvName string = containerAppsEnv.name
