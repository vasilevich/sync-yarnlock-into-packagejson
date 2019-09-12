#!/usr/bin/env node
'use strict';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as glob from 'glob';
import * as childProcess from 'child_process';

import program = require('commander');


program
    .version(require('../package.json').version)
    .description('Sync `yarn.lock` package versions, into package.json')
    .option('-d, --dir <path>', 'directory path where the yarn.lock file is located (default to current directory)')
    .option('-p, --dirPackageJson <path>', 'directory of project with target package.json, if not set, -d will be used')
    .option('-s, --save', 'By default don\'t override the package.json file, make a new one instead package.json.yarn ')
    .option('-k, --keepPrefix', 'By default the ^ or any other dynamic numbers are removed and replaced with static ones.')
    .option('-g, --keepGit', 'By default direct git repositories are also replaced by the version written in yarn.')
    .option('-l, --keepLink', 'By default direct link: repositories are also replaced by the version written in yarn.')
    .option('-a, --keepVariable <variable>', 'By default everything is converted to yarn version, write a part of the type you wish not to convert, seperate by comma if more than one, to not replace git and link you would use +,link:')
    .parse(process.argv);


const proccessVersion = (newVersion, currentVersion) => {
    if (program.keepGit && currentVersion.includes('+'))
        return currentVersion;
    if (program.keepLink && currentVersion.includes('link:'))
        return currentVersion;
    if (program.keepVariable && program.keepVariable.split(',').find(f => currentVersion.includes(f)))
        return currentVersion;
    if (program.keepPrefix) {
      const match = currentVersion.match(/(^[\^><=~]+)/);
      const range = match ? match[0] : '';
      return range + newVersion;
    }
    return newVersion;
}

interface IDependency {
    name: string;
    version: string
}

const yarnLockSyncIntoPackageJson = (packageJsonObject, dependencies: Array<IDependency>) => {
    dependencies.forEach(dependency => {
        if (packageJsonObject.dependencies && dependency.name in packageJsonObject.dependencies) {
            packageJsonObject.dependencies[dependency.name] = proccessVersion(dependency.version, packageJsonObject.dependencies[dependency.name]);
        }
        else if (packageJsonObject.devDependencies && dependency.name in packageJsonObject.devDependencies) {
            packageJsonObject.devDependencies[dependency.name] = proccessVersion(dependency.version, packageJsonObject.devDependencies[dependency.name]);
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
function updatePackage(jsonPath: string, lockedPackages: Array<IDependency>) {
    const packageJsonText = fs.readFileSync(jsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonText);

    if (packageJson.workspaces) {
        const packagePaths = packageJson.workspaces.packages || packageJson.workspaces;
        packagePaths.forEach((packagePath: string) => {
            const packages = glob.sync(`${packagePath}${packagePath.endsWith('/') ? '' : '/'}`, { absolute: true });
            packages.forEach(x => updatePackage(path.join(x, 'package.json'), lockedPackages));
        });
    }

    const saveTo = path.resolve(path.dirname(jsonPath), program.save ? 'package.json' : 'package.json.yarn');
    const newPackageJsonText = (JSON.stringify(yarnLockSyncIntoPackageJson(packageJson, lockedPackages), null, 2) + '\n').replace(/\r?\n/g, getLineFeed(packageJsonText));
    if (!program.save || packageJsonText !== newPackageJsonText) {
        fs.writeFile(saveTo, newPackageJsonText, e => console.log('Saved %s', saveTo, e ? e : ''));
    }
    else {
        console.log("No changes to %s", saveTo)
    }
}

const dir = program.dir ? program.dir : process.cwd();
const packageDir = program.dirPackageJson ? program.dirPackageJson : dir;

const directDepsLines = childProcess.execSync("yarn list --depth=0");

const directDeps = directDepsLines.toString().split(/\r?\n/).map(dep => {
    console.log(dep);
    const nameAndVersion = dep.slice(3);
    const sep = nameAndVersion.lastIndexOf('@');
    return {
        name: nameAndVersion.slice(0, sep),
        version: nameAndVersion.slice(sep + 1)
    };
});

updatePackage(path.resolve(packageDir, 'package.json'), directDeps);