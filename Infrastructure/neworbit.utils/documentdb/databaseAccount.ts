import * as azure from "@pulumi/azure-native";

import { Output } from "@pulumi/pulumi";

import * as neworbit from "..";

type DatabaseAccountArgs = azure.documentdb.DatabaseAccountArgs & { accountName: string };

export const createDatabaseAccountArgs = (
    meta: neworbit.Meta,
    groupName: Output<string>,
    args?: neworbit.DeepPartial<DatabaseAccountArgs>): DatabaseAccountArgs => {

    const accountName = neworbit.generateResourceName(meta, "da", false);

    const defaultArgs: DatabaseAccountArgs = {
        accountName,
        databaseAccountOfferType: azure.documentdb.DatabaseAccountOfferType.Standard,
        resourceGroupName: groupName,
        locations: [{
            failoverPriority: 0,
            isZoneRedundant: false,
            locationName: meta.locationName
        }],
        location: meta.locationName,
        kind: azure.documentdb.DatabaseAccountKind.GlobalDocumentDB,
        tags: neworbit.getDefaultTags(meta),
        disableKeyBasedMetadataWriteAccess: true,
        publicNetworkAccess: "Disabled",
        // disableLocalAuth: true - See https://github.com/NewOrbit/NewOrbit.Pulumi/issues/49
    };

    return neworbit.combineArgs(defaultArgs, args);
};
