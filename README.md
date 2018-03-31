[![npm version](https://badge.fury.io/js/syncyarnlock.svg)](https://www.npmjs.com/package/syncyarnlock)


# syncyarnlock

This program uses yarn's official parser to read the `yarn.lock` file and then
produce a promise that returns a json/object.

## Install
#### YARN
```bash
yarn add -g syncyarnlock
```
### or     
#### NPM
```bash
npm install -g syncyarnlock
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
    -g, --keepGit                By default direct git repositories are also replaced by the version written in yarn.
    -l, --keepLink               By default direct link: repositories are also replaced by the version written in yarn.
    -a, --keepVariable <variable>By default everything is converted to yarn version, write a part of the type you wish not to convert, seperate by comma if more than one, to not replace git and link you would use +,link:
    -h, --help                   output usage information
  Transforms yarn.lock files to JSON
  
  Examples:
  //perform inside a directory with yarn.lock and package.json, will output package.json.yarn in the same directory.
  syncyarnlock   
  

```

## Credits
[zimbatm](https://github.com/zimbatm) - forked [this project ](https://github.com/numtide/yarnlock2json) from theirs, and modified to my needs.