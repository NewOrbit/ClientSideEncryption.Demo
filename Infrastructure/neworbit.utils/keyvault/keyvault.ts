import * as azure from "@pulumi/azure-native";
import { Input, Output } from "@pulumi/pulumi";

import * as neworbit from "..";

type VaultArgs = azure.keyvault.VaultArgs & { vaultName: string };

export const createKeyVaultArgs = (
    meta: neworbit.Meta,
    groupName: Output<string>,
    tenantId: Input<string>,
    args?: neworbit.DeepPartial<VaultArgs>): VaultArgs => {

    const vaultName = neworbit.generateResourceName(meta, "kv", false);

    const defaultArgs: VaultArgs = {
        vaultName,
        location: meta.locationName,
        resourceGroupName: groupName,
        properties: {
            tenantId,
            sku: {
                family: azure.keyvault.SkuFamily.A,
                name: azure.keyvault.SkuName.Standard
            },
            enableRbacAuthorization: true,
            networkAcls: {
                bypass: "None",
                defaultAction: "Deny"
            },
            enablePurgeProtection: true
        },
        tags: neworbit.getDefaultTags(meta)
    };

    return neworbit.combineArgs(defaultArgs, args);
};

