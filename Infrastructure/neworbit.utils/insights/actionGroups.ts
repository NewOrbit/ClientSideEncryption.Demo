import * as azure from "@pulumi/azure-native";
import * as neworbit from "..";

type ActionGroupArgs = azure.insights.ActionGroupArgs & { actionGroupName: string };
export const createActionGroupArgs = (
    meta: neworbit.Meta,
    groupName: string,
    args?: neworbit.DeepPartial<ActionGroupArgs>
): ActionGroupArgs => {
    const actionGroupName = neworbit.generateResourceName(meta, "ag", false);

    const defaultArgs: ActionGroupArgs = {
        enabled: true,
        location: "global",
        groupShortName: actionGroupName.substr(0, 12),
        resourceGroupName: groupName,
        actionGroupName: actionGroupName,
        armRoleReceivers: [
            { name: "Owners", roleId: neworbit.authorization.OwnerRoleId },
            { name: "Contributors", roleId: neworbit.authorization.ContributorRoleId }
        ]
    };

    return neworbit.combineArgs(defaultArgs, args);
};
