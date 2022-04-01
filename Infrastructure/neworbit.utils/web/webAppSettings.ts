import * as azure from "@pulumi/azure-native";

import { Input, Output } from "@pulumi/pulumi";

export class WebAppSettingsBuilder {
    private settings: azure.web.WebAppApplicationSettingsArgs & { name: string };
    private properties: { [key: string]: Input<string> } = {};

    constructor(name: string, resourceGroupName: Output<string>) {
        this.settings = {
            name,
            resourceGroupName,
            properties: this.properties
        };
    }

    public withProperty(propertyName: string, propertyValue?: Input<string>) {
        this.properties[propertyName] = propertyValue ?? "UNDEFINED_PLEASE_SET";
        return this;
    }

    public withAppInsightsConnectionString(propertyValue: Input<string>) {
        return this.withProperty("APPLICATIONINSIGHTS_CONNECTION_STRING", propertyValue);
    }

    public withAspNetCoreEnvironment(propertyValue?: string) {
        const value = propertyValue === "Live" ? "Production" : "Development";
        return this.withProperty("ASPNETCORE_ENVIRONMENT", value);
    }

    public withEnvironmentName(propertyValue?: Input<string>) {
        return this.withProperty("EnvironmentName", propertyValue);
    }

    public withKeyVault(propertyValue?: Input<string>) {
        return this.withProperty("KeyVault__Url", propertyValue);
    }

    public build(): azure.web.WebAppApplicationSettingsArgs & { name: string } {
        return this.settings;
    }
}
