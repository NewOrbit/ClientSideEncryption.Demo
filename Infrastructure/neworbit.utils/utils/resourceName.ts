import { Meta } from "./meta";

export const generateResourceName = (meta: Meta, resourceTypeAbbreviation: string, charactersOnly: boolean = false) => {
    const resourceName = `${meta.shortSystemName}-${meta.environmentName}-${meta.locationAbbreviation}-${resourceTypeAbbreviation}`.toLowerCase();

    return charactersOnly ? resourceName.replace(/-/g,"") : resourceName;
};
