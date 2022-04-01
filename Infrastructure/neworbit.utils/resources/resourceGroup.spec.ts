import { Expect,  Test, TestFixture } from "alsatian";

import * as azure from "@pulumi/azure-native";

import { Input } from "@pulumi/pulumi";

import * as neworbit from "..";

import { createResourceGroupArgs } from "./resourceGroup";

@TestFixture("Resource Group")
export class ResourceGroupArgsSpecs {

    @Test("All the defaults")
    public defaultsOnly() {
        const meta: neworbit.Meta = { locationName: "westeurope", locationAbbreviation: "euw" , shortSystemName: "mysystem", environmentName: "qat" };
        const args = createResourceGroupArgs(meta, "bob");
        const tags = args.tags as { [key: string ]: Input<string> };
        Expect(args.resourceGroupName).toBe("mysystem-qat");
        Expect(tags.Owner).toBe("bob");
        Expect(args.location).toBe("westeurope");
    }

    @Test("Override things")
    public overrideThings() {
        const meta: neworbit.Meta = { locationName: "westeurope", locationAbbreviation: "euw" , shortSystemName: "mysystem", environmentName: "qat" };
        const override: azure.resources.ResourceGroupArgs = {
            location: "uksouth",
            resourceGroupName: "mysystem-qat"
        };
        const args = createResourceGroupArgs(meta, "bob", override);
        const tags = args.tags as { [key: string ]: Input<string> };
        Expect(args.resourceGroupName).toBe("mysystem-qat");
        Expect(tags.Owner).toBe("bob");
        Expect(args.location).toBe("uksouth");
    }

    @Test("Add Tags")
    public async addTags() {
        const meta: neworbit.Meta = { locationName: "westeurope", locationAbbreviation: "euw" , shortSystemName: "mysystem", environmentName: "qat" };
        const override: azure.resources.ResourceGroupArgs = {
            location: "uksouth",
            resourceGroupName: "mysystem-qat",
            tags: {
                mytag: "something"
            }
        };
        const args = createResourceGroupArgs(meta, "bob", override);
        const tags = args.tags as { [key: string ]: Input<string> };
        Expect(tags.Owner).toBe("bob");
        Expect(tags.mytag).toBe("something");
    }

    @Test("Override owner Tag")
    public overrideOwnerTag() {
        const meta: neworbit.Meta = { locationName: "westeurope", locationAbbreviation: "euw" , shortSystemName: "mysystem", environmentName: "qat" };
        const override: azure.resources.ResourceGroupArgs = {
            location: "uksouth",
            resourceGroupName: "mysystem-qat",
            tags: {
                Owner: "lisa"
            }
        };
        const args = createResourceGroupArgs(meta, "bob", override);
        const tags = args.tags as { [key: string ]: Input<string> };
        Expect(tags.Owner).toBe("lisa");
    }
}
