import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure-native";
import * as neworbit from "../../";

export const createAndConnectPrivateEndPoint = (
    meta: neworbit.Meta,
    subnetId: pulumi.Output<string>,
    service: { id: pulumi.Output<string>, name: pulumi.Output<string> },
    serviceConnectionName: string,
    groupIds: string[],
    privateZone: azure.network.PrivateZone,
    resourceGroupName: pulumi.Output<string>) =>
{
    return service.name.apply(serviceName => {
        const displayName = `${serviceName}-${serviceConnectionName}-pep`;
        const privateEndPoint = new azure.network.PrivateEndpoint(displayName, {
            privateEndpointName: displayName,
            location: meta.locationName,
            resourceGroupName,
            subnet: { id: subnetId },
            privateLinkServiceConnections: [
                {
                    name: serviceConnectionName,
                    privateLinkServiceId: service.id,
                    groupIds: groupIds, 
                    privateLinkServiceConnectionState: {
                        actionsRequired: "None",
                        description: "Auto-approved",
                        status: "Approved"
                    }
                }
            ]
        });

        const groupDisplayName = `${serviceName}-${serviceConnectionName}-dzg`;

        // Connects the private DNS Zone and the private end point
        const privateDnsZoneGroup = new azure.network.PrivateDnsZoneGroup(groupDisplayName, {
            privateDnsZoneGroupName: privateZone.name,
            privateEndpointName: privateEndPoint.name,
            resourceGroupName,
            name: privateZone.name,
            privateDnsZoneConfigs: [{
                name: privateZone.name,
                privateDnsZoneId: privateZone.id
            }]
        });

        return privateEndPoint;
    });
}
