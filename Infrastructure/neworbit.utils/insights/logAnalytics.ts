import * as azure from "@pulumi/azure-native";
import { Input, Output } from "@pulumi/pulumi";

import * as neworbit from "..";

type WorkspaceArgs = azure.operationalinsights.WorkspaceArgs & { workspaceName: string };

export const createLogAnalyticsWorkspaceArgs = (
    meta: neworbit.Meta,
    groupName: Output<string>,
    args?: neworbit.DeepPartial<WorkspaceArgs>
): WorkspaceArgs => {
    const workspaceName = neworbit.generateResourceName(meta, "loganalytics", false);

    const defaultArgs: WorkspaceArgs = {
        workspaceName,
        location: meta.locationName,
        resourceGroupName: groupName,
        workspaceCapping: { dailyQuotaGb: 1 },
        tags: neworbit.getDefaultTags(meta),
    };

    return neworbit.combineArgs(defaultArgs, args);
};

