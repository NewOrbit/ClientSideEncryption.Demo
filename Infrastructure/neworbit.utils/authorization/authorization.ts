import * as azure from "@pulumi/azure-native";

import { getClientToken } from "@pulumi/azure-native/authorization";
import { AuthorizationManagementClient, AuthorizationManagementModels } from "@azure/arm-authorization";
import { TokenCredentials } from "@azure/ms-rest-js";

import { RandomUuid } from "@pulumi/random";

let authorizationManagementClient: AuthorizationManagementClient;
export const AppConfigurationDataReaderRole = "App Configuration Data Reader";
export const StorageBlobDataOwnerRole = "Storage Blob Data Owner";
export const StorageBlobDataContributorRole = "Storage Blob Data Contributor";
export const StorageQueueDataContributor = "Storage Queue Data Contributor";
export const KeyVaultSecretsUser = "Key Vault Secrets User";
export const ContributorRoleId = "b24988ac-6180-42a0-ab88-20f7382dd24c";
export const OwnerRoleId = "8e3af657-a8ff-443c-a75c-2fe8c4bcb635";

export const createRoleAssignmentArgs = async (
    roleName: string,
    principalId: string,
    principalType: azure.authorization.PrincipalType,
    subscriptionId: string,
    scope: string): Promise<azure.authorization.RoleAssignmentArgs> => {

    const roleDefinition = await getRoleByName(roleName, subscriptionId, scope);

    const args: azure.authorization.RoleAssignmentArgs = {
        principalId,
        roleDefinitionId: roleDefinition.id ?? "",
        principalType,
        scope,
        roleAssignmentName: new RandomUuid(roleName.concat("--", principalId)).result
    };

    return args;
};

async function getAuthorizationManagementClient(subscriptionId: string): Promise<AuthorizationManagementClient> {
    if (!authorizationManagementClient) {
        const token = await getClientToken();
        const credentials = new TokenCredentials(token.token);
        authorizationManagementClient = new AuthorizationManagementClient(credentials, subscriptionId);
    }
    return authorizationManagementClient;
}

async function getRoleByName(roleName: string, subscriptionId: string, scope?: string): Promise<AuthorizationManagementModels.RoleDefinition> {
    const client = await getAuthorizationManagementClient(subscriptionId);
    const roles = await client.roleDefinitions.list(
        scope || "",
        {
            filter: `roleName eq '${roleName}'`
        },
    );
    if (roles.length === 0) {
        throw new Error(`Error: role "${roleName}" not found at scope "${scope}"`);
    }
    if (roles.length > 1) {
        throw new Error(`Error: too many role "${roleName}" found at scope "${scope}". Found: ${roles.length}`);
    }
    return roles[0];
}
