import * as azure from "@pulumi/azure-native";

import { Output } from "@pulumi/pulumi";

import * as neworbit from "..";

type SqlResourceSqlDatabaseArgs = azure.documentdb.SqlResourceSqlDatabaseArgs & { databaseName: string };

export const createCosmosSqlDatabaseArgs = (
    meta: neworbit.Meta,
    groupName: Output<string>,
    databaseAccountName: Output<string>,
    args?: SqlResourceSqlDatabaseArgs): SqlResourceSqlDatabaseArgs => {

    const databaseName = neworbit.generateResourceName(meta, "cosmosdb", false);

    const defaultArgs: SqlResourceSqlDatabaseArgs = {
        accountName: databaseAccountName,
        databaseName,
        resourceGroupName: groupName,
        resource: {
            id: databaseName
        },
        options: {
            throughput: 400
        },
        tags: neworbit.getDefaultTags(meta)
    };

    return neworbit.combineArgs(defaultArgs, args);
};
