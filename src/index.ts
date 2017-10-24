'use strict';
import * as fs from 'fs';
import * as path from 'path';

const program = require("commander");
import * as yarnconverter from 'yarn-lock-convert';


program
    .version('0.0.1')
    .description('Sync `yarn.lock` package versions, into package.json')
    .option('-d, --dir <path>', 'directory path where the yarn.lock file is located (default to current directory)')
    .option('-p, --dirPackageJson <path>', 'directory of project with target package.json, if not set, -d will be used')
    .option('-s, --save', 'By default don\'t override the package.json file, make a new one instead package.json.yarn ')
    .option('-k, --keepUpArrow', 'By default the ^ or any other dynamic numbers are removed and replaced with static ones.')
    .parse(process.argv);


const proccessVersion = (version) => {
    return program.keepUpArrow ? `^${version}` : version;
}


const yarnLockSyncIntoPackageJson = (packageJsonObject, yarnLockObject) => {
    const yarnLock = Object.keys(yarnLockObject).map(key => ({
        key: key.slice(0, key.lastIndexOf('@')),
        version: yarnLockObject[key].version
    }));
    yarnLock.forEach(dependency => {
        if (packageJsonObject.dependencies && dependency.key in packageJsonObject.dependencies) {
            packageJsonObject.dependencies[dependency.key] = proccessVersion(dependency.version);
        }
        else if (packageJsonObject.devDependencies && dependency.key in packageJsonObject.devDependencies) {
            packageJsonObject.devDependencies[dependency.key] = proccessVersion(dependency.version);
        }
    });
    return packageJsonObject;
};


const dir = program.dir ? program.dir : process.cwd();
const packageDir = program.dirPackageJson ? program.dirPackageJson : dir;
const saveTo = path.resolve(packageDir, program.save ? "package.json" : "package.json.yarn");
yarnconverter.toObject().then((yarnLockObj) => {
    (fs.readFile(path.resolve(packageDir, "package.json"), "utf8", (err, packageJsonString) => {
        fs.writeFile(saveTo, JSON.stringify(yarnLockSyncIntoPackageJson(JSON.parse(packageJsonString), yarnLockObj), null, 2), (e) => console.log("done", e ? e : ""));
    }));
});


