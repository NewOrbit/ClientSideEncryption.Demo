import * as azure from "@pulumi/azure-native";

import { Output } from "@pulumi/pulumi";

import * as neworbit from "..";

type AppServicePlanArgs = azure.web.AppServicePlanArgs & { name: string };

export const createAppServicePlanArgs = (
    meta: neworbit.Meta,
    groupName: Output<string>,
    args?: neworbit.DeepPartial<AppServicePlanArgs>): AppServicePlanArgs => {

    const appServicePlanName = neworbit.generateResourceName(meta, "asp", false);

    const sku = (meta.environmentType === "Live") ?
        {
            tier: "Standard",
            size: "S1",
            name: "S1"
        } :
        {
            tier: "Basic",
            size: "B1",
            name: "B1"
        };

    const defaultArgs: AppServicePlanArgs = {
        name: appServicePlanName,
        location: meta.locationName,
        resourceGroupName: groupName,
        tags: neworbit.getDefaultTags(meta),
        kind: "Linux",
        reserved: true, // Required for Linux apparently
        sku
    };

    return neworbit.combineArgs(defaultArgs, args);
};
