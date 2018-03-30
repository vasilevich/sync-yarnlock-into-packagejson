[![npm version](https://badge.fury.io/js/sync-yarnlock-into-packagejson.svg)](https://www.npmjs.com/package/sync-yarnlock-into-packagejson)


# sync-yarnlock-into-packagejson

This program uses yarn's official parser to read the `yarn.lock` file and then
produce a promise that returns a json/object.

## Install
#### ~~YARN~~( Doesn't work because of the HYPHENS please use npm)
```bash
yarn add -g sync-yarnlock-into-packagejson
```
### or     
#### NPM
```bash
npm install -g sync-yarnlock-into-packagejson
```


## Usage

```
  Usage: syncyarnlock [options]

  Sync `yarn.lock` package versions, into package.json


  Options:

    -V, --version                output the version number
    -d, --dir <path>             directory path where the yarn.lock file is located (default to current directory)
    -p, --dirPackageJson <path>  directory of project with target package.json, if not set, -d will be used
    -s, --save                   By default don't override the package.json file, make a new one instead package.json.yarn
    -k, --keepUpArrow            By default the ^ or any other dynamic numbers are removed and replaced with static ones.
    -h, --help                   output usage information
  Transforms yarn.lock files to JSON
  
  Examples:
  //perform inside a directory with yarn.lock and package.json, will output package.json.yarn in the same directory.
  syncyarnlock   
  

```

## Credits
[zimbatm](https://github.com/zimbatm) - forked [this project ](https://github.com/numtide/yarnlock2json) from theirs, and modified to my needs.