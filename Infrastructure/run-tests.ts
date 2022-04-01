import { TestSet, TestRunner } from "alsatian";
// import "./test-setup";
// import { register } from "tsconfig-paths";

// Convert path aliases (e.g. @common/*) to relative paths
// eslint-disable-next-line @typescript-eslint/no-var-requires
// const { compilerOptions } = require("./tsconfig.json");
// const { baseUrl, paths } = compilerOptions;
// register({ baseUrl, paths });
const testSet = TestSet.create();
testSet.addTestsFromFiles("./neworbit.utils/**/*.spec.{ts,tsx}");

if (testSet.testFixtures.length === 0) {
    // eslint-disable-next-line no-console
    console.warn("No tests found");
} else {
    const testRunner = new TestRunner();
    testRunner.outputStream.pipe(process.stdout);
    testRunner.run(testSet);
}
