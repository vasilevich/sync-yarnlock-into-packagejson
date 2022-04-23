import childProcess from "child_process";
import program from "commander";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { NpmList, PackageJson, PackageVersionsAndUrls } from "./types";

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
    "By default everything is converted to yarn version, write a part of the type you wish not to convert, separate by comma if more than one, to not replace git and link you would use +,link:"
  )
  .parse(process.argv);

const getUpdatedVersion = (newVersion: string, currentVersion: string) => {
  if (program.keepGit && currentVersion.includes("+")) return currentVersion;
  if (program.keepLink && currentVersion.includes("link:"))
    return currentVersion;
  if (
    program.keepVariable &&
    (program.keepVariable as string)
      .split(",")
      .find((f) => currentVersion.includes(f))
  ) {
    return currentVersion;
  }
  if (program.keepPrefix) {
    const match = currentVersion.match(/(^[\^><=~]+)/);
    const range = match ? match[0] : "";
    return range + newVersion;
  }
  return newVersion;
};

const syncIntoPackageJson = (
  packageJsonObject: PackageJson,
  installedPackages: PackageVersionsAndUrls
) => {
  const dependencyNames = Object.keys(installedPackages);
  dependencyNames.forEach((dependencyName) => {
    const name = dependencyName;
    const version = installedPackages[dependencyName].version;

    if (
      packageJsonObject.dependencies &&
      name in packageJsonObject.dependencies
    ) {
      packageJsonObject.dependencies[name] = getUpdatedVersion(
        version,
        packageJsonObject.dependencies[name]
      );
    } else if (
      packageJsonObject.devDependencies &&
      name in packageJsonObject.devDependencies
    ) {
      packageJsonObject.devDependencies[name] = getUpdatedVersion(
        version,
        packageJsonObject.devDependencies[name]
      );
    }
  });
  return packageJsonObject;
};

function getEolCharacter(source: string) {
  const match = source.match(/\r?\n/);
  return match === null ? os.EOL : match[0];
}

// Only the root package.json file contains a workspaces field but to simplify the code we don't separate the logic.
async function updatePackageJson(
  jsonPath: string,
  rootDeps: PackageVersionsAndUrls
) {
  if (!(await fs.stat(jsonPath))) {
    return;
  }

  const packageJsonText = await fs.readFile(jsonPath, "utf8");
  const originalPackageJson = JSON.parse(packageJsonText) as PackageJson;
  const saveTo = path.resolve(
    path.dirname(jsonPath),
    program.save ? "package.json" : "package.json.yarn"
  );

  const updatedPackageJson = syncIntoPackageJson(originalPackageJson, rootDeps);
  const newPackageJsonText = (
    JSON.stringify(updatedPackageJson, null, 2) + "\n"
  ).replace(/\r?\n/g, getEolCharacter(packageJsonText));
  if (!program.save || packageJsonText !== newPackageJsonText) {
    try {
      await fs.writeFile(saveTo, newPackageJsonText);
    } catch (error) {
      console.error("Saved %s", saveTo, error);
    }
  } else {
    console.log("No changes to %s", saveTo);
  }

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
}

const dir = program.dir ? program.dir : process.cwd();
const packageDir = program.dirPackageJson ? program.dirPackageJson : dir;

const installedPackages = (
  JSON.parse(childProcess.execSync("npm list --json").toString()) as NpmList
).dependencies;

updatePackageJson(path.resolve(packageDir, "package.json"), installedPackages);
