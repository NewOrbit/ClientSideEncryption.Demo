import * as azure from "@pulumi/azure-native";
import { Output } from "@pulumi/pulumi";

import * as neworbit from "..";

type DatabaseArgs = azure.sql.DatabaseArgs & { databaseName: string };

export const createSqlDatabaseArgs = (
    meta: neworbit.Meta,
    groupName: Output<string>,
    serverName: Output<string>,
    args?: neworbit.DeepPartial<DatabaseArgs>): DatabaseArgs => {

    const databaseName = neworbit.generateResourceName(meta, "sqldb", false);

    const defaultArgs: DatabaseArgs = {
        databaseName,
        location: meta.locationName,
        resourceGroupName: groupName,
        serverName,
        sku: {
            family: "S",
            name: "S1",
            tier: "Standard"
        },
        tags: neworbit.getDefaultTags(meta)
    };

    return neworbit.combineArgs(defaultArgs, args);
};
