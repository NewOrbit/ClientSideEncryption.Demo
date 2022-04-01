import * as pulumi from "@pulumi/pulumi";

import { Meta } from "./meta";

export const getDefaultTags = (meta: Meta): pulumi.Input<{[key: string]: pulumi.Input<string>}> => {
    return {
        Environment: meta.environmentType,
        Scale: "Normal"
    };
};
