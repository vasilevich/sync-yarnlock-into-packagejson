import fs from "fs";
import os from "os";
import {
  PackageJson,
  PackageLockJson,
  PackagesInfo,
  PackageVersions,
} from "./types";

// Only the root package.json file contains a workspaces field but to simplify the code we don't separate the logic.
export const syncPackageJson = (
  inputPackageJsonPath: string,
  packageLockJsonPath: string,
  outputPackageJsonPath: string
) => {
  if (!fs.statSync(inputPackageJsonPath)) {
    return;
  }

  const installedPackages = getInstalledPackages(packageLockJsonPath);
  const originalPackageJsonText = fs.readFileSync(inputPackageJsonPath, "utf8");
  const packageJsonObject = JSON.parse(originalPackageJsonText) as PackageJson;

  updatePackageJsonObject(packageJsonObject, installedPackages);
  writePackageJson(
    originalPackageJsonText,
    packageJsonObject,
    outputPackageJsonPath
  );
};

const getInstalledPackages = (packageLockJsonPath: string): PackagesInfo => {
  const packageLockJsonText = fs.readFileSync(packageLockJsonPath, "utf8");
  const packageLockJsonObject = JSON.parse(
    packageLockJsonText
  ) as PackageLockJson;

  return packageLockJsonObject.dependencies;
};

const updatePackageJsonObject = (
  packageJsonObject: PackageJson,
  installedPackages: PackagesInfo
) => {
  if (packageJsonObject.dependencies !== undefined) {
    updatePackageVersions(packageJsonObject.dependencies, installedPackages);
  }

  if (packageJsonObject.devDependencies !== undefined) {
    updatePackageVersions(packageJsonObject.devDependencies, installedPackages);
  }

  if (packageJsonObject.peerDependencies !== undefined) {
    updatePackageVersions(
      packageJsonObject.peerDependencies,
      installedPackages
    );
  }
};

const updatePackageVersions = (
  packageVersions: PackageVersions,
  installedPackages: PackagesInfo
) => {
  const packageNames = Object.keys(packageVersions);
  for (const packageName of packageNames) {
    const originalVersionWithRange = packageVersions[packageName];
    const installedVersionWithoutRange = installedPackages[packageName].version;
    const updatedVersionWithRange = getUpdatedVersionWithRange(
      originalVersionWithRange,
      installedVersionWithoutRange
    );
    packageVersions[packageName] = updatedVersionWithRange;
  }
};

const getUpdatedVersionWithRange = (
  originalVersionWithRange: string,
  installedVersionWithoutRange: string
) => {
  if (originalVersionWithRange.includes("+")) {
    return originalVersionWithRange;
  }

  if (originalVersionWithRange.includes("link:")) {
    return originalVersionWithRange;
  }

  const range = getRangePrefix(originalVersionWithRange);
  return range + installedVersionWithoutRange;
};

const getRangePrefix = (versionWithRange: string): string => {
  // Match any combination of ^, >, <, = and ~ characters at the beginning of the string.
  const rangeMatches = versionWithRange.match(/(^[\^><=~]+)/);
  if (rangeMatches === null) {
    return "";
  }

  return rangeMatches[0];
};

const writePackageJson = (
  originalPackageJsonText: string,
  packageJsonObject: PackageJson,
  outputPackageJsonPath: string
) => {
  const packageJsonEolCharacters = getEolCharacter(originalPackageJsonText);
  const updatedPackageJsonText = getPackageJsonText(
    packageJsonObject,
    packageJsonEolCharacters
  );

  if (updatedPackageJsonText === originalPackageJsonText) {
    console.info(
      "All package versions in %s already match the installed ones.",
      outputPackageJsonPath
    );
    return;
  }

  try {
    fs.writeFileSync(outputPackageJsonPath, updatedPackageJsonText);
  } catch (error) {
    console.error("Error saving %s.", outputPackageJsonPath, error);
    return;
  }

  console.info(
    "Updated package versions in %s to match the installed ones.",
    outputPackageJsonPath
  );
};

const getEolCharacter = (packageJsonText: string) => {
  const match = packageJsonText.match(/\r?\n/);
  if (match === null) {
    return os.EOL;
  }

  return match[0];
};

const getPackageJsonText = (
  packageJsonObject: PackageJson,
  eolCharacters: string
) => {
  const packageJsonText =
    JSON.stringify(packageJsonObject, undefined, 2) + "\n";
  const withCorrectEols = packageJsonText.replace(/\r?\n/g, eolCharacters);
  return withCorrectEols;
};
