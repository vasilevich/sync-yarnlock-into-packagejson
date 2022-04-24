import fs from "fs";
import path from "path";
import { syncPackageJson } from "./syncpackagejson";

test("Upgrades versions correctly.", () => {
  const initialPackageJsonPath = path.join(
    __dirname,
    "./testData/1/initial-package.json"
  );
  const packageLockJsonPath = path.join(
    __dirname,
    "./testData/1/package-lock.json"
  );
  const updatedPackageJsonPath = path.join(
    __dirname,
    "./testData/1/updated-package.json"
  );
  const expectedPackageJsonPath = path.join(
    __dirname,
    "./testData/1/expected-package.json"
  );

  syncPackageJson(
    initialPackageJsonPath,
    packageLockJsonPath,
    updatedPackageJsonPath
  );

  const updatedPackageJsonText = fs.readFileSync(
    updatedPackageJsonPath,
    "utf8"
  );

  const expectedPackageJsonText = fs.readFileSync(
    expectedPackageJsonPath,
    "utf8"
  );

  expect(updatedPackageJsonText).toEqual(expectedPackageJsonText);
});
