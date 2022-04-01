import * as azure from "@pulumi/azure-native";
import * as pulumi from "@pulumi/pulumi";
import * as neworbit from "../../";

export const createAndLinkDnsZone = (meta: neworbit.Meta, resourceGroupName: pulumi.Output<string>, zoneName: string, zoneUrl: string, vnetId: pulumi.Output<string>) => {
    const displayName = neworbit.generateResourceName(meta, `${zoneName}-pz`);
    const linkName = neworbit.generateResourceName(meta, `${zoneName}-vnl`);

    const privateDnsZone = new azure.network.PrivateZone(displayName, {
        privateZoneName: zoneUrl,
        resourceGroupName,
        location: "global"
    });

    const dnsVnetLinkBlob = new azure.network.VirtualNetworkLink(linkName, {
        privateZoneName: privateDnsZone.name,
        resourceGroupName,
        virtualNetworkLinkName: linkName,
        registrationEnabled: false,
        virtualNetwork: { id: vnetId },
        location: "global"
    });

    return privateDnsZone;
}
