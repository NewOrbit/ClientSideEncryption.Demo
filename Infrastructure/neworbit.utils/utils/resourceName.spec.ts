import { Expect, TestCase, TestFixture } from "alsatian";

import { generateResourceName } from "./resourceName";

@TestFixture("GenerateResourceName")
export class ResourceNameTests {
    @TestCase("mysystem", "QAT", "eun", "as", false, "mysystem-qat-eun-as")
    @TestCase("mysystem", "QAT", "eun", "as", true, "mysystemqateunas")
    public resourceNameTest(shortSystemName: string, environment: string, location: "eun" | "euw", type: string, charOnly: boolean, expected: string) {
        const generated = generateResourceName({
            shortSystemName,
            locationAbbreviation: location,
            environmentName: environment
        }, type, charOnly);

        Expect(generated).toBe(expected);
    }
}
