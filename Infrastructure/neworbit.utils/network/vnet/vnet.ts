import * as azure from "@pulumi/azure-native";
import * as pulumi from "@pulumi/pulumi";

import * as neworbit from "../../";

type VirtualNetworkArgs = azure.network.VirtualNetworkArgs & { virtualNetworkName: string };

export const createVnetArgs = (
    meta: neworbit.Meta,
    resourceGroupName: pulumi.Output<string>, 
    args?: VirtualNetworkArgs): VirtualNetworkArgs => {

    const virtualNetworkName = neworbit.generateResourceName(meta, "vnet", false);

    const defaultArgs: VirtualNetworkArgs = {
        virtualNetworkName,
        location: meta.locationName,
        resourceGroupName,
        addressSpace: { addressPrefixes: ["10.0.0.0/16"] },
        tags: neworbit.getDefaultTags(meta)
    };

    return neworbit.combineArgs(defaultArgs, args);
};
