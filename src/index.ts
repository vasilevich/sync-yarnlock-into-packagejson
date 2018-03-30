#!/usr/bin/env node
'use strict';
import * as fs from 'fs';
import * as path from 'path';

const program = require('commander');
import * as yarnconverter from 'yarn-lock-convert';


program
    .version(require('../package.json').version)
    .description('Sync `yarn.lock` package versions, into package.json')
    .option('-d, --dir <path>', 'directory path where the yarn.lock file is located (default to current directory)')
    .option('-p, --dirPackageJson <path>', 'directory of project with target package.json, if not set, -d will be used')
    .option('-s, --save', 'By default don\'t override the package.json file, make a new one instead package.json.yarn ')
    .option('-k, --keepUpArrow', 'By default the ^ or any other dynamic numbers are removed and replaced with static ones.')
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
    return program.keepUpArrow ? `^${newVersion}` : newVersion;
}


const yarnLockSyncIntoPackageJson = (packageJsonObject, yarnLockObject) => {
    const yarnLock = Object.keys(yarnLockObject).map(key => ({
        key: key.slice(0, key.lastIndexOf('@')),
        version: yarnLockObject[key].version
    }));
    yarnLock.forEach(dependency => {
        if (packageJsonObject.dependencies && dependency.key in packageJsonObject.dependencies) {
            packageJsonObject.dependencies[dependency.key] = proccessVersion(dependency.version, packageJsonObject.dependencies[dependency.key]);
        }
        else if (packageJsonObject.devDependencies && dependency.key in packageJsonObject.devDependencies) {
            packageJsonObject.devDependencies[dependency.key] = proccessVersion(dependency.version, packageJsonObject.devDependencies[dependency.key]);
        }
    });
    return packageJsonObject;
};


const dir = program.dir ? program.dir : process.cwd();
const packageDir = program.dirPackageJson ? program.dirPackageJson : dir;
const saveTo = path.resolve(packageDir, program.save ? 'package.json' : 'package.json.yarn');
yarnconverter.toObject().then((yarnLockObj) => {
    (fs.readFile(path.resolve(packageDir, 'package.json'), 'utf8', (err, packageJsonString) => {
        fs.writeFile(saveTo, JSON.stringify(yarnLockSyncIntoPackageJson(JSON.parse(packageJsonString), yarnLockObj), null, 2), (e) => console.log('done', e ? e : ''));
    }));
});


