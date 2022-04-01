import * as azure from "@pulumi/azure-native";

import { Output } from "@pulumi/pulumi";

import * as neworbit from "..";

type WebAppArgs = azure.web.WebAppArgs & { name: string };

export const createFunctionAppArgs = (
    meta: neworbit.Meta,
    groupName: Output<string>,
    appServicePlanId: Output<string>,
    args?: neworbit.DeepPartial<WebAppArgs>): WebAppArgs => {

    const functionAppName = neworbit.generateResourceName(meta, "fa", false);

    const defaultArgs: WebAppArgs = {
        name: functionAppName,
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
                    // Ideally this should also include the ID of the specific front-door as a header, but this is not supported yet in Pulumi so needs to be done manually in the portal after.
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
            vnetRouteAllEnabled: true
        },
        clientAffinityEnabled: false,
        kind: "FunctionApp",
        enabled: true,
        reserved: true,
        identity: {
            type: "SystemAssigned"
        }
    };

    return neworbit.combineArgs(defaultArgs, args);
};
