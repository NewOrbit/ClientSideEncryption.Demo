import { Expect, Test, TestFixture } from "alsatian";
import * as azure from "@pulumi/azure-native";

import { combineArgs } from "./combineArgs";

@TestFixture("Combine Args")
export class CombineArgsSpecs {

    @Test("All the defaults")
    public defaultsOnly() {
        const defaultArgs: azure.resources.ResourceGroupArgs = {
            resourceGroupName: "mysystem-qat",
            location: "europewest",
            tags: {
                Owner: "bob"
            }
        };

        const args = combineArgs<any>(defaultArgs);
        Expect(args.resourceGroupName).toBe("mysystem-qat");
        Expect(args.tags.Owner).toBe("bob");
        Expect(args.location).toBe("europewest");
        Expect(args.tags.Owner).toBe("bob");
    }

    @Test("Override things")
    public overrideThings() {
        const defaultArgs: azure.resources.ResourceGroupArgs = {
            resourceGroupName: "mysystem-qat",
            location: "europewest",
            tags: {
                Owner: "bob"
            }
        };

        const override: azure.resources.ResourceGroupArgs = {
            resourceGroupName: "mysystem-qat",
            location: "uksouth"
        };
        const args = combineArgs<any>(defaultArgs, override);
        Expect(args.resourceGroupName).toBe("mysystem-qat");
        Expect(args.tags.Owner).toBe("bob");
        Expect(args.location).toBe("uksouth");
    }

    @Test("Add Tags")
    public addTags() {
        const defaultArgs: azure.resources.ResourceGroupArgs = {
            resourceGroupName: "mysystem-qat",
            location: "europewest",
            tags: {
                Owner: "bob"
            }
        };

        const override: azure.resources.ResourceGroupArgs = {
            resourceGroupName: "mysystem-qat",
            location: "uksouth",
            tags: {
                mytag: "something"
            }
        };
        const args = combineArgs<any>(defaultArgs, override);
        Expect(args.tags.Owner).toBe("bob");
        Expect(args.tags.mytag).toBe("something");
    }

    @Test("Overrride owner Tag")
    public overrideOwnerTag() {
        const defaultArgs: azure.resources.ResourceGroupArgs = {
            resourceGroupName: "mysystem-qat",
            location: "europewest",
            tags: {
                Owner: "bob"
            }
        };

        const override: azure.resources.ResourceGroupArgs = {
            resourceGroupName: "mysystem-qat",
            location: "europewest",
            tags: {
                Owner: "lisa"
            }
        };
        const args = combineArgs<any>(defaultArgs, override);
        Expect(args.tags.Owner).toBe("lisa");
    }

    @Test("Arbitrary object on default")
    public arbitraryObjectOnDefault() {
        const defaultArgs = {
            name: "bob",
            stuff: {
                foo: "bar"
            }
        };

        const override = {
            something: "summat"
        };

        const args = combineArgs<any>(defaultArgs, override) ;

        Expect(args.stuff).toBeDefined();
        Expect(args.stuff.foo).toBe("bar");
    }

    @Test("Arbitrary object on args")
    public arbitraryObjectOnArgs() {
        const defaultArgs = {
            name: "bob",

        };

        const override = {
            something: "summat",
            stuff: {
                foo: "bar"
            }
        };

        const args = combineArgs<any>(defaultArgs, override) ;

        Expect(args.stuff).toBeDefined();
        Expect(args.stuff.foo).toBe("bar");
    }
    @Test("Arbitray object on both")
    public arbitraryObjectOnBoth() {
        const defaultArgs = {
            name: "bob",
            stuff: {
                foo: "bar",
                source: "default"
            }
        };

        const override = {
            something: "summat",
            stuff: {
                a: "b",
                source: "args"
            }
        };

        const args = combineArgs<any>(defaultArgs, override) ;

        Expect(args.stuff).toBeDefined();
        Expect(args.stuff.foo).toBe("bar");
        Expect(args.stuff.a).toBe("b");
        Expect(args.stuff.source).toBe("args");
    }
}
