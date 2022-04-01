import * as azure from "@pulumi/azure-native";

import { Output } from "@pulumi/pulumi";

import * as neworbit from "..";

type WebAppArgs = azure.web.WebAppArgs & { name: string };

export const createWebAppArgs = (
    meta: neworbit.Meta,
    groupName: Output<string>,
    appServicePlanId: Output<string>,
    args?: neworbit.DeepPartial<WebAppArgs>): WebAppArgs => {

    const webAppName = neworbit.generateResourceName(meta, "as", false);

    // TODO: Ask for optional application insights and wire it up?
    const defaultArgs: WebAppArgs = {
        name: webAppName,
        location: meta.locationName,
        resourceGroupName: groupName,
        tags: neworbit.getDefaultTags(meta),
        serverFarmId: appServicePlanId,
        httpsOnly: true,
        siteConfig: {
            alwaysOn: true,
            ftpsState: "Disabled",
            http20Enabled: true,
            minTlsVersion: azure.web.SupportedTlsVersions.SupportedTlsVersions_1_2,
            use32BitWorkerProcess: false,
            ipSecurityRestrictions: [
                {
                    name: "FrontDoor",
                    action: "Allow",
                    priority: 100,
                    ipAddress: "AzureFrontDoor.Backend",
                    tag: "ServiceTag"
                }
            ], // Override this when the app service is not public facing
            // ipSecurityRestrictions: [
            //     {
            //         name: "frontendvnet",
            //         action: "Allow",
            //         priority: 100,
            //         vnetSubnetResourceId: subnet.id
            //     }
            // ],
            vnetRouteAllEnabled: true,
        },
        clientAffinityEnabled: false,
        kind: "app,linux,container",
        enabled: true,
        reserved: true,
        identity: {
            type: "SystemAssigned"
        }
    };

    return neworbit.combineArgs(defaultArgs, args);
};
