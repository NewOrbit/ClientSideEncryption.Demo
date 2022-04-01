import * as pulumi from "@pulumi/pulumi";

export interface Meta {
    /** Every system should have a short abbreviation that can be used in various places, referred to as "short system name".
     * This is sometimes different from the customer name - see the repository naming guidelines for some further thoughts on this
     * https://github.com/NewOrbit/Guidelines/blob/master/infrastructure/azure-naming-conventions.md
     */
    shortSystemName?: string;

    /** Use `az account list-location to find and add new ones not on this list */
    locationName?:
    "eastus"               |
    "eastus2"              |
    "southcentralus"       |
    "westus2"              |
    "australiaeast"        |
    "southeastasia"        |
    "northeurope"          |
    "uksouth"              |
    "westeurope"           |
    "centralus"            |
    "northcentralus"       |
    "westus"               |
    "southafricanorth"     |
    "centralindia"         |
    "eastasia"             |
    "japaneast"            |
    "koreacentral"         |
    "canadacentral"        |
    "francecentral"        |
    "germanywestcentral"   |
    "norwayeast"           |
    "switzerlandnorth"     |
    "uaenorth"             |
    "brazilsouth"          |
    "centralusstage"       |
    "eastusstage"          |
    "eastus2stage"         |
    "northcentralusstage"  |
    "southcentralusstage"  |
    "westusstage"          |
    "westus2stage"         |
    "asia"                 |
    "asiapacific"          |
    "australia"            |
    "brazil"               |
    "canada"               |
    "europe"               |
    "global"               |
    "india"                |
    "japan"                |
    "uk"                   |
    "unitedstates"         |
    "eastasiastage"        |
    "southeastasiastage"   |
    "centraluseuap"        |
    "eastus2euap"          |
    "westcentralus"        |
    "southafricawest"      |
    "australiacentral"     |
    "australiacentral2"    |
    "australiasoutheast"   |
    "japanwest"            |
    "koreasouth"           |
    "southindia"           |
    "westindia"            |
    "canadaeast"           |
    "francesouth"          |
    "germanynorth"         |
    "norwaywest"           |
    "switzerlandwest"      |
    "ukwest"               |
    "uaecentral"           |
    "brazilsoutheast";

    /** See https://github.com/NewOrbit/Guidelines/blob/master/infrastructure/azure-naming-conventions.md for our guidance. Add as needed in both places. */
    locationAbbreviation?: "eun" | "euw" | "uks" | "ukw" | "aue" | "inc";

    /** Used in resource names, usually Live, QAT, UAT etc. Keep it short and avoid dashes.
     * Will default to the stack name if not specified
     */
    environmentName?: string;

    environmentType: "Live" | "Testing" | "Demo" | "Experiment";
}

/**
 * Create a Meta data object for passing to other functions.
 * Combines your optional input with what's in config and calculates group name if not specified
 *
 * @param {Meta} existing pass in whatever settings you
 * @returns {Meta}
 */
export const generateMetaFromConfig = (existing? : Meta): Meta => {
    const config = new pulumi.Config();
    const configMeta = config.requireObject<Meta>("meta");

    const newMeta = { ...configMeta, ...(existing || {}) };

    const environment = pulumi.getStack();
    newMeta.environmentName = newMeta.environmentName || environment;

    if (!(newMeta.shortSystemName)) {
        throw new Error("shortSystemName is required in config");
    }

    if (!(newMeta.locationName)) {
        throw new Error("locationName is required in config");
    }

    if (!(newMeta.locationAbbreviation)) {
        throw new Error("locationAbbreviation is required in config");
    }

    if (!(newMeta.environmentType)) {
        throw new Error("environmentType is required in config. Specify `Live` | `Testing` | `Demo` | `Experiment`");
    }

    return newMeta;
};

