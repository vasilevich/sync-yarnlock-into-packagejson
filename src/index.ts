#!/usr/bin/env node
"use strict";
import * as childProcess from "child_process";
import * as fs from "fs";
import * as glob from "glob";
import * as os from "os";
import * as path from "path";

import program = require("commander");

program
  .version(require("../package.json").version)
  .description("Sync `yarn.lock` package versions, into package.json")
  .option(
    "-d, --dir <path>",
    "directory path where the yarn.lock file is located (default to current directory)"
  )
  .option(
    "-p, --dirPackageJson <path>",
    "directory of project with target package.json, if not set, -d will be used"
  )
  .option(
    "-s, --save",
    "By default don't override the package.json file, make a new one instead package.json.yarn "
  )
  .option(
    "-k, --keepPrefix",
    "By default the ^ or any other dynamic numbers are removed and replaced with static ones."
  )
  .option(
    "-g, --keepGit",
    "By default direct git repositories are also replaced by the version written in yarn."
  )
  .option(
    "-l, --keepLink",
    "By default direct link: repositories are also replaced by the version written in yarn."
  )
  .option(
    "-a, --keepVariable <variable>",
    "By default everything is converted to yarn version, write a part of the type you wish not to convert, seperate by comma if more than one, to not replace git and link you would use +,link:"
  )
  .parse(process.argv);

const proccessVersion = (newVersion, currentVersion) => {
  if (program.keepGit && currentVersion.includes("+")) return currentVersion;
  if (program.keepLink && currentVersion.includes("link:"))
    return currentVersion;
  if (
    program.keepVariable &&
    program.keepVariable.split(",").find((f) => currentVersion.includes(f))
  )
    return currentVersion;
  if (program.keepPrefix) {
    const match = currentVersion.match(/(^[\^><=~]+)/);
    const range = match ? match[0] : "";
    return range + newVersion;
  }
  return newVersion;
};

interface IDependency {
  name: string;
  version: string;
}

const syncDepsIntoPackageJson = (packageJsonObject, deps) => {
  deps.forEach((dependency) => {
    const sep = dependency.name.lastIndexOf("@");
    const name = dependency.name.slice(0, sep);
    const version = dependency.name.slice(sep + 1);

    if (
      packageJsonObject.dependencies &&
      name in packageJsonObject.dependencies
    ) {
      packageJsonObject.dependencies[name] = proccessVersion(
        version,
        packageJsonObject.dependencies[name]
      );
    } else if (
      packageJsonObject.devDependencies &&
      name in packageJsonObject.devDependencies
    ) {
      packageJsonObject.devDependencies[name] = proccessVersion(
        version,
        packageJsonObject.devDependencies[name]
      );
    }
  });
  return packageJsonObject;
};

function getLineFeed(source: string) {
  const match = source.match(/\r?\n/);
  return match === null ? os.EOL : match[0];
}

// Only the root package.json file contains a workspaces field
// But to simplify the code we don't seperate the logic
function updatePackage(jsonPath: string, rootDeps) {
  if (!fs.existsSync(jsonPath)) return;
  const packageJsonText = fs.readFileSync(jsonPath, "utf8");
  const packageJson = JSON.parse(packageJsonText);
  const saveTo = path.resolve(
    path.dirname(jsonPath),
    program.save ? "package.json" : "package.json.yarn"
  );

  const workspacePackageDeps =
    (rootDeps.find((dep) => dep.name.startsWith(`${packageJson.name}@`)) || {})
      .children || [];
  const syncedDeps = syncDepsIntoPackageJson(
    packageJson,
    rootDeps.concat(workspacePackageDeps)
  );
  const newPackageJsonText = (
    JSON.stringify(syncedDeps, null, 2) + "\n"
  ).replace(/\r?\n/g, getLineFeed(packageJsonText));
  if (!program.save || packageJsonText !== newPackageJsonText) {
    fs.writeFile(saveTo, newPackageJsonText, (e) =>
      console.log("Saved %s", saveTo, e ? e : "")
    );
  } else {
    console.log("No changes to %s", saveTo);
  }

  if (packageJson.workspaces) {
    const packagePaths =
      packageJson.workspaces.packages || packageJson.workspaces;
    if (Array.isArray(packagePaths)) {
      packagePaths.forEach((packagePath: string) => {
        const packages = glob.sync(
          `${packagePath}${packagePath.endsWith("/") ? "" : "/"}`,
          { absolute: true }
        );
        packages.forEach((workspaceDir) => {
          const workspacePackageJson = path.join(workspaceDir, "package.json");
          updatePackage(workspacePackageJson, rootDeps);
        });
      });
    }
  }
}

const dir = program.dir ? program.dir : process.cwd();
const packageDir = program.dirPackageJson ? program.dirPackageJson : dir;

const depsTree = JSON.parse(
  childProcess.execSync("yarn list --json --depth 1").toString()
).data.trees;

updatePackage(path.resolve(packageDir, "package.json"), depsTree);
