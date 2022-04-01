import { TokenCredentials } from "@azure/ms-rest-js";
import * as azure from "@pulumi/azure-native";
import { getClientToken } from "@pulumi/azure-native/authorization";
import { SubscriptionClientContext, Subscriptions } from "@azure/arm-subscriptions";
import * as azuread from "@pulumi/azuread";

import * as pulumi from "@pulumi/pulumi";

import * as random from "@pulumi/random";

import * as neworbit from "..";

type ServerArgs = azure.sql.ServerArgs & { serverName: string };

/**
 * Creates a random admin password, *which is stored in the state file.*
 * You should use Managed Identity and AD to access the database so should not need this.
 * Alternatively, pass in the uid/pwd you want.
 * @param meta
 * @param groupName
 * @param args Optional args to override defaults
 * @returns SqlServerArgs
 */

export const createSqlServerArgs = (
    meta: neworbit.Meta,
    groupName: pulumi.Output<string>,
    args?: neworbit.DeepPartial<ServerArgs>): ServerArgs => {

    const serverName = neworbit.generateResourceName(meta, "ss", false);
    const passwordProvider = new random.RandomPassword("password", { length: 16 });

    const defaultArgs: ServerArgs = {
        administratorLogin: `${meta.shortSystemName}${meta.environmentName}admin`,
        administratorLoginPassword: passwordProvider.result,
        resourceGroupName: groupName,
        location: meta.locationName,
        minimalTlsVersion: "1.2",
        serverName,
        publicNetworkAccess: "Disabled",
        version: "12.0",
        tags: neworbit.getDefaultTags(meta),
        // administrators: {
        //     administratorType: "ActiveDirectory",
        //     azureADOnlyAuthentication: true,
        //     login: serverAdminGroup.displayName,
        //     sid: serverAdminGroup.objectId,
        //     principalType: "Group",
        //     tenantId: pulumi.output(azure.authorization.getClientConfig()).apply(x => x.tenantId)
        // }
    };

    return neworbit.combineArgs(defaultArgs, args);
};

// type GroupArgs = azuread.GroupArgs & { displayName: string };

// export const createSqlServerAdminGroupArgs = (args?: neworbit.DeepPartial<GroupArgs>): pulumi.Output<GroupArgs> => {
//     return pulumi.all([azure.authorization.getClientConfig(), getClientToken()]).apply(async ([clientConfig, token]) => {
//         const credentials = new TokenCredentials(token.token);
//         const subscriptionClientContext = new SubscriptionClientContext(credentials);
//         const subscriptions = new Subscriptions(subscriptionClientContext);
//         const subscription = await subscriptions.get(clientConfig.subscriptionId);
//         const defaultArgs = {
//             displayName: "SQL Admin for " + subscription.displayName,
//         };
//         return neworbit.combineArgs(defaultArgs, args);
//     });
// };
