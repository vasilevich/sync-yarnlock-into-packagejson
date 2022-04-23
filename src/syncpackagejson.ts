import childProcess from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { NpmList, PackageJson, PackageVersionsAndUrls } from "./types";

// Only the root package.json file contains a workspaces field but to simplify the code we don't separate the logic.
const synchronizeInstalledVersionsIntoPackageJson = () => {
  const packageJsonPath = path.resolve(process.cwd(), "package.json");
  if (!fs.statSync(packageJsonPath)) {
    return;
  }

  const installedPackages = getNpmListOutput().dependencies;
  const originalPackageJsonText = fs.readFileSync(packageJsonPath, "utf8");
  const packageJsonObject = JSON.parse(originalPackageJsonText) as PackageJson;

  updatePackageJsonObject(packageJsonObject, installedPackages);
  writePackageJson(originalPackageJsonText, packageJsonObject, packageJsonPath);

  // if (originalPackageJson.workspaces) {
  //   const packagePaths =
  //     originalPackageJson.workspaces.packages || originalPackageJson.workspaces;
  //   if (Array.isArray(packagePaths)) {
  //     for (const packagePath of packagePaths) {
  //       const packages = glob.sync(
  //         `${packagePath}${packagePath.endsWith("/") ? "" : "/"}`,
  //         { absolute: true }
  //       );
  //       for (const workspaceDir of packages) {
  //         const workspacePackageJson = path.join(workspaceDir, "package.json");
  //         await updatePackageJson(workspacePackageJson, installedPackages);
  //       }
  //     }
  //   }
  // }
};

const getNpmListOutput = (): NpmList => {
  return JSON.parse(childProcess.execSync("npm list --json").toString());
};

const updatePackageJsonObject = (
  packageJsonObject: PackageJson,
  installedPackages: PackageVersionsAndUrls
) => {
  const dependencyNames = Object.keys(installedPackages);
  dependencyNames.forEach((dependencyName) => {
    const installedVersionWithoutRange =
      installedPackages[dependencyName].version;

    if (
      packageJsonObject.dependencies &&
      dependencyName in packageJsonObject.dependencies
    ) {
      packageJsonObject.dependencies[dependencyName] =
        getUpdatedVersionWithRange(
          packageJsonObject.dependencies[dependencyName],
          installedVersionWithoutRange
        );
    } else if (
      packageJsonObject.devDependencies &&
      dependencyName in packageJsonObject.devDependencies
    ) {
      packageJsonObject.devDependencies[dependencyName] =
        getUpdatedVersionWithRange(
          packageJsonObject.devDependencies[dependencyName],
          installedVersionWithoutRange
        );
    }
  });
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
  packageJsonPath: string
) => {
  const packageJsonEolCharacters = getEolCharacter(originalPackageJsonText);
  const updatedPackageJsonText = getPackageJsonText(
    packageJsonObject,
    packageJsonEolCharacters
  );

  if (updatedPackageJsonText === originalPackageJsonText) {
    console.info(
      "All package versions in %s already match the installed ones.",
      packageJsonPath
    );
    return;
  }

  try {
    fs.writeFileSync(packageJsonPath, updatedPackageJsonText);
  } catch (error) {
    console.error("Error saving %s.", packageJsonPath, error);
    return;
  }

  console.info(
    "Updated package versions in %s to match the installed ones.",
    packageJsonPath
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

synchronizeInstalledVersionsIntoPackageJson();
