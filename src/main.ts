import path from "path";
import { syncPackageJson } from "./syncpackagejson";

const main = () => {
  const inputPackageJsonPath = path.resolve(process.cwd(), "package.json");
  const packageLockJsonPath = path.resolve(process.cwd(), "package-lock.json");
  const outputPackageJsonPath = path.resolve(process.cwd(), "package.json");

  syncPackageJson(
    inputPackageJsonPath,
    packageLockJsonPath,
    outputPackageJsonPath
  );
};

main();
