// Creates the Azure Container Registry used to store Docker images.
// Deploy this once before the first image push.
targetScope = 'resourceGroup'

@description('Azure region for all resources')
param location string = resourceGroup().location

@description('Application name prefix (lowercase, no spaces)')
param appName string = 'banking-ops'

@description('Deployment environment')
@allowed(['dev', 'staging', 'prod'])
param environment string = 'prod'

// ACR names must be globally unique, alphanumeric only, 5-50 chars
var acrName = replace('${appName}${environment}acr', '-', '')

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: true
  }
}

output acrLoginServer string = acr.properties.loginServer
output acrName string = acr.name
