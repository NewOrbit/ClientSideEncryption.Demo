import * as azure from "@pulumi/azure-native";

import * as neworbit from "../../";

type FrontDoorArgs = azure.network.FrontDoorArgs & { frontDoorName: string };

export const createFrontDoorArgs = (
    meta: neworbit.Meta,
    subscriptionId: string,
    backendUrl: string,
    groupName: string,
    args?: FrontDoorArgs): FrontDoorArgs => {

    const frontDoorName = neworbit.generateResourceName(meta, "fd", false);
    const frontDoorRootId = `/subscriptions/${subscriptionId}/resourceGroups/${groupName}/providers/Microsoft.Network/frontDoors/${frontDoorName}`;

    const defaultArgs: FrontDoorArgs = {
        frontDoorName,
        enabledState: azure.network.FrontDoorEnabledState.Enabled,
        location: "global",     // Enforced by Azure, cannot be changed
        resourceGroupName: groupName,
        backendPools: [
            {
                backends: [
                    {
                        address: backendUrl,
                        backendHostHeader: backendUrl,
                        httpPort: 80,
                        httpsPort: 443,
                        weight: 50,
                        priority: 1,
                        enabledState: azure.network.BackendEnabledState.Enabled
                    }
                ],
                loadBalancingSettings:
                {
                    id: `${frontDoorRootId}/loadBalancingSettings/loadBalancingSettings1`,
                },
                healthProbeSettings:
                {
                    id: `${frontDoorRootId}/healthProbeSettings/healthProbeSettings1`,
                },
                name: frontDoorName,
            }
        ],
        frontendEndpoints: [
            {
                hostName: `${frontDoorName}.azurefd.net`,
                name: "default"
            }
        ],
        loadBalancingSettings: [
            {
                name: "loadBalancingSettings1",
                sampleSize: 4,
                successfulSamplesRequired: 2
            }
        ],
        healthProbeSettings: [
            {
                name: "healthProbeSettings1",
                enabledState: azure.network.HealthProbeEnabled.Disabled,
                path: "/",
                protocol: "Https",
                intervalInSeconds: 120
            }
        ],
        routingRules: [
            {
                acceptedProtocols: [azure.network.FrontDoorProtocol.Https],
                enabledState: azure.network.RoutingRuleEnabledState.Enabled,
                frontendEndpoints: [{
                    id: `${frontDoorRootId}/frontendEndpoints/default`
                }],
                name: frontDoorName,
                patternsToMatch: ["/*"],
                routeConfiguration: {
                    backendPool: {
                        id: `${frontDoorRootId}/backendPools/${frontDoorName}`
                    },
                    forwardingProtocol: azure.network.FrontDoorForwardingProtocol.HttpsOnly,
                    odataType: "#Microsoft.Azure.FrontDoor.Models.FrontdoorForwardingConfiguration"
                }
            }
        ],
        tags: neworbit.getDefaultTags(meta)
    };

    return neworbit.combineArgs(defaultArgs, args);
};
