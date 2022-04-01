import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure-native";
import * as azuread from "@pulumi/azuread";

import * as neworbit from "../neworbit.utils";
import { RandomUuid } from "@pulumi/random";
import { JsonWebKeyType } from "@pulumi/azure-native/keyvault";

// ************** Set config **************
const meta = neworbit.generateMetaFromConfig();
// const clientConfig = pulumi.output(azure.authorization.getClientConfig());
const clientConfig = {
    subscriptionId: "33b84d52-5ab7-4975-80b4-35f034fcc35d",
    tenantId: "09639da7-e072-4542-917d-cad1a646ab6b"
};

const config = new pulumi.Config();
// ****************************************

const resourceGroupArgs = neworbit.resources.createResourceGroupArgs(meta, config.require("owner"), {
    tags: {
        Environment: "Experiment"
    }
});
const resourceGroup = new azure.resources.ResourceGroup(resourceGroupArgs.resourceGroupName, resourceGroupArgs);

// ************** Create StorageAccounts & Private endpoints **************
const storageAccountArgs = neworbit.storage.createAccountArgs(meta, resourceGroup.name);
const storageAccount = new azure.storage.StorageAccount(storageAccountArgs.accountName, storageAccountArgs);

new azure.authorization.ManagementLockByScope("CanNotDelete", {
    level: "CanNotDelete",
    scope: storageAccount.id
});


const appServicePlanArgs = neworbit.web.createAppServicePlanArgs(meta, resourceGroup.name);
const appServicePlan = new azure.web.AppServicePlan(appServicePlanArgs.name, appServicePlanArgs);

const appServicePlanId = appServicePlan.id;


// ************** Create WebApp **************
const webAppServiceArgs = neworbit.web.createWebAppArgs(meta, resourceGroup.name, appServicePlanId);
const webAppService = new azure.web.WebApp(webAppServiceArgs.name, webAppServiceArgs);
const webAppPrincipalId = webAppService.identity.apply(i => i?.principalId ?? "");


// Give this WebApp access to blobs
pulumi.all([clientConfig.subscriptionId, storageAccount.id, webAppPrincipalId]).apply(async ([subscriptionId, storageAccountId, webAppPrincipalId]) => {
    const roleToAssign = neworbit.authorization.StorageBlobDataContributorRole;
    const roleAssignmentArgs = await neworbit.authorization.createRoleAssignmentArgs(
        roleToAssign,
        webAppPrincipalId,
        azure.authorization.PrincipalType.ServicePrincipal,
        subscriptionId,
        storageAccountId
    );

    return new azure.authorization.RoleAssignment(roleToAssign.concat("--", webAppPrincipalId), roleAssignmentArgs);
});

// Give this WebApp access to queues
pulumi.all([clientConfig.subscriptionId, storageAccount.id, webAppPrincipalId]).apply(async ([subscriptionId, storageAccountId, webAppPrincipalId]) => {
    const roleToAssign = neworbit.authorization.StorageQueueDataContributor;
    const roleAssignmentArgs = await neworbit.authorization.createRoleAssignmentArgs(
        roleToAssign,
        webAppPrincipalId,
        azure.authorization.PrincipalType.ServicePrincipal,
        subscriptionId,
        storageAccountId
    );

    return new azure.authorization.RoleAssignment(roleToAssign.concat("--", webAppPrincipalId), roleAssignmentArgs);
});
// *******************************************


// ************** Create KeyVault **************
const keyVaultArgs = neworbit.keyvault.createKeyVaultArgs(meta, resourceGroup.name, clientConfig.tenantId);
const keyVault = new azure.keyvault.Vault(keyVaultArgs.vaultName, keyVaultArgs);

new azure.keyvault.Secret("Secret1", {
    resourceGroupName: resourceGroup.name,
    vaultName: keyVault.name,
    secretName: "Secret1",
    properties: {
        value: "TopSecret"
    }
});

new azure.keyvault.Key("BlobEncryption", {
    resourceGroupName: resourceGroup.name,
    keyName: "BlobEncryption",
    vaultName: keyVault.name,
    properties: {
        kty: JsonWebKeyType.RSA,
        keySize: 2048
    }
})


// Give web app access to secrets
pulumi.all([clientConfig.subscriptionId, keyVault.id, webAppPrincipalId]).apply(async ([subscriptionId, keyVaultId, webAppPrincipalId]) => {
    // const roleToAssign = neworbit.authorization.KeyVaultSecretsUser;
    // const roleAssignmentArgs = await neworbit.authorization.createRoleAssignmentArgs(
    //     roleToAssign,
    //     webAppPrincipalId,
    //     azure.authorization.PrincipalType.ServicePrincipal,
    //     subscriptionId,
    //     keyVaultId
    // );

    // new azure.authorization.RoleAssignment(roleToAssign.concat("Secret--", webAppPrincipalId), roleAssignmentArgs);

    //const roleToAssign = neworbit.authorization.KeyVaultSecretsUser;
    const roleAssignmentArgs2 = await neworbit.authorization.createRoleAssignmentArgs(
        "Key Vault Crypto User",
        webAppPrincipalId,
        azure.authorization.PrincipalType.ServicePrincipal,
        subscriptionId,
        keyVaultId
    );

    new azure.authorization.RoleAssignment("Crypto--".concat(webAppPrincipalId), roleAssignmentArgs2);

});
// **********************************************

// ************** Create SqlServer **************
// const sqlServerAdminArgs = neworbit.sql.createSqlServerAdminGroupArgs();
// const serverAdminGroup = sqlServerAdminArgs.apply(args => new azuread.Group(args.displayName, args));
// pulumi.all([serverAdminGroup, sqlServerAdminArgs]).apply(([serverAdminGroup, sqlServerAdminArgs]) => pulumi.log.info(`Don't forget to assign users to the ${sqlServerAdminArgs.displayName} group`, serverAdminGroup));

const sqlServerArgs = neworbit.sql.createSqlServerArgs(meta, resourceGroup.name);
const sqlServer = new azure.sql.Server(sqlServerArgs.serverName, sqlServerArgs);

// Create SqlDatabase in the SqlServer created above
const sqlDatabaseArgs = neworbit.sql.createSqlDatabaseArgs(meta, resourceGroup.name, sqlServer.name);
const sqlDatabase = new azure.sql.Database(sqlDatabaseArgs.databaseName, sqlDatabaseArgs);

pulumi.all([sqlDatabase.name, sqlServer.fullyQualifiedDomainName, webAppService.name]).apply(([sqlDatabaseName, sqlServerDns, webAppServiceName]) => {
    // Use database name to set connection string
    pulumi.log.info(`Log into ${sqlDatabaseName} on ${sqlServerDns} and run the following scripts to finish setting access for the application on the sql database`, sqlDatabase); // eslint-disable-line max-len
    pulumi.log.info(`CREATE USER [${webAppServiceName}] FROM EXTERNAL PROVIDER;`, sqlDatabase);
    pulumi.log.info(`ALTER ROLE db_datareader ADD MEMBER [${webAppServiceName}];`, sqlDatabase);
    pulumi.log.info(`ALTER ROLE db_datawriter ADD MEMBER [${webAppServiceName}];`, sqlDatabase);
    pulumi.log.info(`ALTER ROLE db_ddladmin ADD MEMBER [${webAppServiceName}];`, sqlDatabase);
});
export const sqlConnectionString =
    pulumi.all([sqlServer.fullyQualifiedDomainName, sqlDatabase.name])
        .apply(([s, d]) => `Server=${s}; Authentication=Active Directory Default; Database=${d};`);

// **********************************************

// ************** Set WebApp Settings **************
// These are set last so you can get the various IDs/URLs for other resources that you create and need to link

const webAppSettings = new neworbit.web.WebAppSettingsBuilder(webAppServiceArgs.name, resourceGroup.name)
    .withAspNetCoreEnvironment(meta.environmentType)
    .withKeyVault(keyVault.properties.apply(i => i?.vaultUri ?? ""))
    .withEnvironmentName(meta.environmentName)
    // .withProperty("WEBSITE_DNS_SERVER", "168.63.129.16")
    .build();

new azure.web.WebAppApplicationSettings(webAppSettings.name, webAppSettings);


// ************** Create Networking **************
// if (meta.environmentType === "Live") {
//     const vnetArgs = neworbit.network.vnet.createVnetArgs(meta, resourceGroup.name);

//     const vnet = new azure.network.VirtualNetwork(vnetArgs.virtualNetworkName, vnetArgs);
//     const backEndSubnet = new azure.network.Subnet("backEnd", {
//         subnetName: "backEnd",
//         addressPrefix: "10.0.2.0/24",
//         virtualNetworkName: vnet.name,
//         resourceGroupName: resourceGroup.name,
//         privateEndpointNetworkPolicies: "disabled"
//     });

//     const frontEndSubnet = new azure.network.Subnet("frontEnd", {
//         subnetName: "frontEnd",
//         addressPrefix: "10.0.1.0/24",
//         virtualNetworkName: vnet.name,
//         resourceGroupName: resourceGroup.name,
//         delegations: [
//             { 
//                 serviceName: "Microsoft.Web/serverfarms",
//                 name: "front-end-delegation"
//             }
//         ]
//     });

//     const gatewaySubnet = new azure.network.Subnet("GatewaySubnet", {
//         subnetName: "GatewaySubnet",
//         addressPrefix: "10.0.3.0/24",
//         virtualNetworkName: vnet.name,
//         resourceGroupName: resourceGroup.name
//     });

//     const gatewayIp = new azure.network.PublicIPAddress(`${vnetArgs.virtualNetworkName}-gateway-pip`, {
//         publicIpAddressName: `${vnetArgs.virtualNetworkName}-gateway-pip`,
//         resourceGroupName: resourceGroup.name,
//         location: meta.locationName
//     });

//     new azure.network.VirtualNetworkGateway(`${vnetArgs.virtualNetworkName}-gateway`, {
//         resourceGroupName: resourceGroup.name,
//         location: meta.locationName,
//         virtualNetworkGatewayName: `${vnetArgs.virtualNetworkName}-gateway`,
//         ipConfigurations: [
//             {
//                 name: "default",
//                 publicIPAddress: { id: gatewayIp.id },
//                 subnet: { id: gatewaySubnet.id },
//                 privateIPAllocationMethod: "Dynamic"
//             }
//         ],
//         gatewayType: 'Vpn',
//         vpnType: 'RouteBased',
//         vpnClientConfiguration: {
//             vpnClientProtocols: ['OpenVPN'],
//             vpnClientAddressPool: { addressPrefixes: ["172.16.201.0/24"] },
//             vpnAuthenticationTypes: ["AAD"],
//             aadTenant: clientConfig.tenantId.apply(t => `https://login.microsoftonline.com/${t}/`),
//             aadIssuer: clientConfig.tenantId.apply(t => `https://sts.windows.net/${t}/`),
//             aadAudience: "41b23e61-6c1e-4545-b367-cd054e0ed4b4"
//         },
//         sku: { tier: "VpnGw1", name: "VpnGw1" },
//         vpnGatewayGeneration: "Generation1"
//     });

//     new azure.web.WebAppSwiftVirtualNetworkConnection(`${webAppServiceArgs.name}-vc`, {
//         name: webAppService.name,
//         resourceGroupName: resourceGroup.name,
//         subnetResourceId: frontEndSubnet.id
//     });

//     new azure.web.WebAppSwiftVirtualNetworkConnection(`${functionAppServiceArgs.name}-vc`, {
//         name: functionApp.name,
//         resourceGroupName: resourceGroup.name,
//         subnetResourceId: frontEndSubnet.id
//     });

//     const privateDnsZoneBlob = neworbit.network.vnet.createAndLinkDnsZone(meta, resourceGroup.name, "blob", "privatelink.blob.core.windows.net", vnet.id);
//     const privateDnsZoneTable = neworbit.network.vnet.createAndLinkDnsZone(meta, resourceGroup.name, "table", "privatelink.table.core.windows.net", vnet.id);
//     const privateDnsZoneQueue = neworbit.network.vnet.createAndLinkDnsZone(meta, resourceGroup.name, "queue", "privatelink.queue.core.windows.net", vnet.id);
//     const privateDnsZoneFile = neworbit.network.vnet.createAndLinkDnsZone(meta, resourceGroup.name, "file", "privatelink.file.core.windows.net", vnet.id);
//     const privateDnsZoneCosmos = neworbit.network.vnet.createAndLinkDnsZone(meta, resourceGroup.name, "cosmos", "privatelink.documents.azure.com", vnet.id);
//     const privateDnsZoneKeyVault = neworbit.network.vnet.createAndLinkDnsZone(meta, resourceGroup.name, "keyvault", "privatelink.vaultcore.azure.net", vnet.id);
//     const privateDnsZoneSql = neworbit.network.vnet.createAndLinkDnsZone(meta, resourceGroup.name, "sql", "privatelink.database.windows.net", vnet.id);
//     const privateDnsZoneAppConfiguration = neworbit.network.vnet.createAndLinkDnsZone(meta, resourceGroup.name, "appconfig", "privatelink.azconfig.io", vnet.id);

//     neworbit.network.vnet.createAndConnectPrivateEndPoint(
//         meta,
//         backEndSubnet.id,
//         sharedAppConfiguration,
//         "appconfig",
//         ["configurationStores"],
//         privateDnsZoneAppConfiguration,
//         resourceGroup.name
//     );

//     neworbit.network.vnet.createAndConnectPrivateEndPoint(
//         meta,
//         backEndSubnet.id,
//         { id: storageAccount.id, name: storageAccount.name }, 
//         "blob",
//         ["blob"],
//         privateDnsZoneBlob,
//         resourceGroup.name
//     );

//     neworbit.network.vnet.createAndConnectPrivateEndPoint(
//         meta,
//         backEndSubnet.id,
//         { id: storageAccount.id, name: storageAccount.name }, 
//         "table",
//         ["table"],
//         privateDnsZoneTable,
//         resourceGroup.name
//     );

//     neworbit.network.vnet.createAndConnectPrivateEndPoint(
//         meta,
//         backEndSubnet.id,
//         { id: storageAccount.id, name: storageAccount.name },
//         "queue",
//         ["queue"],
//         privateDnsZoneQueue,
//         resourceGroup.name
//     );

//     neworbit.network.vnet.createAndConnectPrivateEndPoint(
//         meta,
//         backEndSubnet.id,
//         { id: storageAccount.id, name: storageAccount.name },
//         "file",
//         ["file"],
//         privateDnsZoneFile,
//         resourceGroup.name
//     );

//     neworbit.network.vnet.createAndConnectPrivateEndPoint(
//         meta,
//         backEndSubnet.id,
//         keyVault,
//         "keyvault",
//         ["vault"],
//         privateDnsZoneKeyVault,
//         resourceGroup.name
//     );

//     neworbit.network.vnet.createAndConnectPrivateEndPoint(
//         meta,
//         backEndSubnet.id,
//         documentDbAccount,
//         "documentDb",
//         ["Sql"],
//         privateDnsZoneCosmos,
//         resourceGroup.name
//     );

//     neworbit.network.vnet.createAndConnectPrivateEndPoint(
//         meta,
//         backEndSubnet.id,
//         sqlServer,
//         "sql",
//         ["SQLServer"],
//         privateDnsZoneSql,
//         resourceGroup.name
//     );

//     neworbit.network.vnet.createAndConnectPrivateEndPoint(
//         meta,
//         backEndSubnet.id,
//         functionAppStorageAccount, 
//         "blob",
//         ["blob"],
//         privateDnsZoneBlob,
//         resourceGroup.name
//     );

//     neworbit.network.vnet.createAndConnectPrivateEndPoint(
//         meta,
//         backEndSubnet.id,
//         functionAppStorageAccount, 
//         "table",
//         ["table"],
//         privateDnsZoneTable,
//         resourceGroup.name
//     );

//     neworbit.network.vnet.createAndConnectPrivateEndPoint(
//         meta,
//         backEndSubnet.id,
//         functionAppStorageAccount,
//         "queue",
//         ["queue"],
//         privateDnsZoneQueue,
//         resourceGroup.name
//     );

//     neworbit.network.vnet.createAndConnectPrivateEndPoint(
//         meta,
//         backEndSubnet.id,
//         functionAppStorageAccount,
//         "file",
//         ["file"],
//         privateDnsZoneFile,
//         resourceGroup.name
//     );
// }

// ***************************************************

// ************** Create FrontDoor **************
