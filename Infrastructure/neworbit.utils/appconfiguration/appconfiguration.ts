import * as azure from "@pulumi/azure-native";
import { Output } from "@pulumi/pulumi";

import * as neworbit from "..";

type ConfigurationStoreArgs = azure.appconfiguration.ConfigurationStoreArgs & { configStoreName: string };

export const createAppConfigurationArgs = (
    meta: neworbit.Meta,
    groupName: Output<string>,
    args?: neworbit.DeepPartial<ConfigurationStoreArgs>): ConfigurationStoreArgs => {

    const configStoreName = neworbit.generateResourceName(meta, "appconfig", false);

    const defaultArgs: ConfigurationStoreArgs = {
        configStoreName,
        location: meta.locationName,
        resourceGroupName: groupName,
        sku: {
            name: "Standard"  // @Frans do we want to put this on a paid tier straightaway to avoid the issue I had with Corinthian?
        },
        publicNetworkAccess: "Enabled", // Private endpoints will be used but We still want public access for local development
        tags: neworbit.getDefaultTags(meta)
    };

    return neworbit.combineArgs(defaultArgs, args);
};
