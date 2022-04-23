import childProcess from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { NpmList, PackageJson, PackageVersionsAndUrls } from "./types";

const main = () => {
  const packageJsonPath = path.resolve(process.cwd(), "package.json");
  const installedPackages = getNpmListOutput().dependencies;
  synchronizeInstalledVersionsIntoPackageJson(
    packageJsonPath,
    installedPackages
  );
};

const getNpmListOutput = (): NpmList => {
  return JSON.parse(childProcess.execSync("npm list --json").toString());
};

// Only the root package.json file contains a workspaces field but to simplify the code we don't separate the logic.
const synchronizeInstalledVersionsIntoPackageJson = (
  packageJsonPath: string,
  rootDeps: PackageVersionsAndUrls
) => {
  if (!fs.statSync(packageJsonPath)) {
    return;
  }

  const originalPackageJsonText = fs.readFileSync(packageJsonPath, "utf8");
  const packageJson = JSON.parse(originalPackageJsonText) as PackageJson;

  updatePackageJsonObject(packageJson, rootDeps);
  const updatedPackageJsonText = (
    JSON.stringify(packageJson, null, 2) + "\n"
  ).replace(/\r?\n/g, getEolCharacter(originalPackageJsonText));

  if (updatedPackageJsonText === originalPackageJsonText) {
    console.info(
      "All package versions in %s match the installed ones.",
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
    "Updated package version in %s to match the installed ones.",
    packageJsonPath
  );

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

const updatePackageJsonObject = (
  packageJson: PackageJson,
  installedPackages: PackageVersionsAndUrls
) => {
  const dependencyNames = Object.keys(installedPackages);
  dependencyNames.forEach((dependencyName) => {
    const installedVersionWithoutRange =
      installedPackages[dependencyName].version;

    if (
      packageJson.dependencies &&
      dependencyName in packageJson.dependencies
    ) {
      packageJson.dependencies[dependencyName] = getUpdatedVersionWithRange(
        packageJson.dependencies[dependencyName],
        installedVersionWithoutRange
      );
    } else if (
      packageJson.devDependencies &&
      dependencyName in packageJson.devDependencies
    ) {
      packageJson.devDependencies[dependencyName] = getUpdatedVersionWithRange(
        packageJson.devDependencies[dependencyName],
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

  const range = getRange(originalVersionWithRange);
  return range + installedVersionWithoutRange;
};

const getRange = (versionWithRange: string): string => {
  // Match any combination of ^, <, >, = and ~ characters at the beginning of the string.
  const rangeMatches = versionWithRange.match(/(^[\^><=~]+)/);
  if (rangeMatches === null) {
    return "";
  }

  return rangeMatches[0];
};

const getEolCharacter = (source: string) => {
  const match = source.match(/\r?\n/);
  return match === null ? os.EOL : match[0];
};

main();
