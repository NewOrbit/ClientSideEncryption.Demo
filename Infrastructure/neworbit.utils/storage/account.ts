import * as azure from "@pulumi/azure-native";

import { Input } from "@pulumi/pulumi";

import * as neworbit from "..";

export const createAccountArgs =
    (meta: neworbit.Meta, groupName: Input<string>, args?: neworbit.DeepPartial<azure.storage.StorageAccountArgs & { accountName: string }>): azure.storage.StorageAccountArgs & { accountName: string } => {
        const storageAccountName = neworbit.generateResourceName(meta, "sa", true);
        return createDefaultArgs(meta, storageAccountName, groupName, args);
    };

export const createFunctionsAccountArgs =
    (meta: neworbit.Meta, functionsAppArgs: azure.web.WebAppArgs & { name: string }, args?: neworbit.DeepPartial<azure.storage.StorageAccountArgs & { accountName: string }>): azure.storage.StorageAccountArgs & { accountName: string } => {
        const storageAccountName = `${functionsAppArgs.name}sa`.replace(/-/g,"");

        return createDefaultArgs(meta, storageAccountName, functionsAppArgs.resourceGroupName, args);
    };

const createDefaultArgs = 
    (meta: neworbit.Meta, storageAccountName: string, groupName: Input<string>, args?: neworbit.DeepPartial<azure.storage.StorageAccountArgs & { accountName: string }>): azure.storage.StorageAccountArgs & { accountName: string } => {
        const defaultArgs: azure.storage.StorageAccountArgs & { accountName: string } = {
            accountName: storageAccountName,
            kind: azure.storage.Kind.StorageV2,
            location: meta.locationName,
            minimumTlsVersion: azure.storage.MinimumTlsVersion.TLS1_2,
            resourceGroupName: groupName,
            sku: {
                name: (meta.environmentType === "Live" ? azure.storage.SkuName.Standard_GRS : azure.storage.SkuName.Standard_LRS)
            },
            tags: neworbit.getDefaultTags(meta),
            enableHttpsTrafficOnly: true,
            allowSharedKeyAccess: false,
            allowBlobPublicAccess: false,
            networkRuleSet: {
                defaultAction: "Deny",
                bypass: "None"
            }
        };

        return neworbit.combineArgs(defaultArgs, args);
    };
