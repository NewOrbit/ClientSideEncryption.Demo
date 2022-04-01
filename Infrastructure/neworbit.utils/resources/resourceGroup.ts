import * as azure from "@pulumi/azure-native";

import { Input } from "@pulumi/pulumi";

import * as neworbit from "..";

interface MustHaveTags {
    tags: Input<{ [key: string]: Input<string> }>;
}

type ResourceGroupArgs = azure.resources.ResourceGroupArgs & MustHaveTags & { resourceGroupName: string };

export const createResourceGroupArgs =
    (meta: neworbit.Meta, owner: string, args?: neworbit.DeepPartial<ResourceGroupArgs>): ResourceGroupArgs => {
        const defaultArgs: ResourceGroupArgs & { resourceGroupName: string } = {
            location: meta.locationName,
            resourceGroupName: `${meta.shortSystemName}-${meta.environmentName}`,
            tags: {
                Owner: owner
            }
        };

        return neworbit.combineArgs(defaultArgs, args);
    };
