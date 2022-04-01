import * as azure from "@pulumi/azure-native";
import { Input, Output } from "@pulumi/pulumi";
import * as neworbit from "..";

type ScheduledQueryRuleArgs = azure.insights.ScheduledQueryRuleArgs & { ruleName: string };

export const createLogAnalyticsWorkspaceExceedCapAlertArgs = (
    meta: neworbit.Meta,
    groupName: Output<string>,
    actionGroupId: Output<string>,
    logAnalyticsWorkspace: azure.operationalinsights.Workspace,
    args?: neworbit.DeepPartial<ScheduledQueryRuleArgs>
): ScheduledQueryRuleArgs => createLogAnalyticsWorkspaceAlertArgs(
    meta,
    groupName,
    actionGroupId,
    logAnalyticsWorkspace,
    "0",
    "Alerts when the log analytics injestion cap has been exceeded",
    "Log analytics cap exceeded",
    "_LogOperation | where Operation =~ \"Data collection stopped\" | where Detail contains \"OverQuota\"",
    {
        frequencyInMinutes: 5,
        timeWindowInMinutes: 5,
    },
    args
);

export const createLogAnalyticsWorkspaceNearCapAlertArgs = (
    meta: neworbit.Meta,
    groupName: Output<string>,
    actionGroupId: Output<string>,
    logAnalyticsWorkspace: azure.operationalinsights.Workspace,
    args?: neworbit.DeepPartial<ScheduledQueryRuleArgs>
): ScheduledQueryRuleArgs => createLogAnalyticsWorkspaceAlertArgs(
    meta,
    groupName,
    actionGroupId,
    logAnalyticsWorkspace,
    "2",
    "Alerts when the log analytics injestion is 80% of cap",
    "Close to Log analytics cap",
    logAnalyticsWorkspace.workspaceCapping.apply(cap => `Usage | where IsBillable | summarize DataGB = sum(Quantity / 1000.) | where DataGB > ${cap?.dailyQuotaGb ?? 0 / 100 * 80}`),
    {
        frequencyInMinutes: 60,
        timeWindowInMinutes: 1440, // 24 hours
    },
    args
);

const createLogAnalyticsWorkspaceAlertArgs = (
    meta: neworbit.Meta,
    groupName: Output<string>,
    actionGroupId: Output<string>,
    logAnalyticsWorkspace: azure.operationalinsights.Workspace,
    severity: azure.types.enums.insights.AlertSeverity,
    description: string,
    ruleName: string,
    query: Input<string>,
    schedule: azure.types.input.insights.ScheduleArgs,
    args?: neworbit.DeepPartial<ScheduledQueryRuleArgs>
): ScheduledQueryRuleArgs => {
    const defaultArgs: ScheduledQueryRuleArgs = {
        action: {
            aznsAction: {
                actionGroup: [actionGroupId]
            },
            odataType: "Microsoft.WindowsAzure.Management.Monitoring.Alerts.Models.Microsoft.AppInsights.Nexus.DataContracts.Resources.ScheduledQueryRules.AlertingAction",
            severity,
            trigger: {
                threshold: 0,
                thresholdOperator: "GreaterThan"
            }
        },
        description,
        ruleName,
        location: meta.locationName,
        resourceGroupName: groupName,
        tags: neworbit.getDefaultTags(meta),
        schedule,
        source: {
            dataSourceId: logAnalyticsWorkspace.id,
            query,
            queryType: "ResultCount"
        }
    };

    return neworbit.combineArgs(defaultArgs, args);
};
