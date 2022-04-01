import * as azure from "@pulumi/azure-native";
import { Output } from "@pulumi/pulumi";

import * as neworbit from "..";

type ComponentArgs = azure.insights.v20200202.ComponentArgs & { resourceName: string };

export const createAppInsightsArgs = (
    meta: neworbit.Meta,
    groupName: Output<string>,
    workspaceResourceId: Output<string>,
    args?: neworbit.DeepPartial<ComponentArgs>
): ComponentArgs => {
    const resourceName = neworbit.generateResourceName(meta, "insights", false);

    const defaultArgs: ComponentArgs = {
        resourceName,
        location: meta.locationName,
        resourceGroupName: groupName,
        applicationType: azure.insights.ApplicationType.Web,
        flowType: azure.insights.FlowType.Bluefield,
        kind: "web",
        requestSource: azure.insights.RequestSource.Rest,
        workspaceResourceId,
        samplingPercentage: 100,
        // Frans, do we want to set any of these?
        // disableIpMasking
        // ingestionMode
        // retentionInDays
        tags: neworbit.getDefaultTags(meta),
    };

    return neworbit.combineArgs(defaultArgs, args);
};
