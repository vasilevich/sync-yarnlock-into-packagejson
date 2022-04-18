# syncpackagejson

Sync installed versions of npm packages into package.json.

## To Do

- Update the code to match the output of `npm list --json`.
- Add tests.
- Remove most of the options.
- Release version 0.1.
- Replace commander with [yargs](https://github.com/yargs/yargs) or something else.
- Explain how this little program works here in the readme.

## Usage

```shell
Usage: npx syncpackagejson [options]

Sync installed versions of npm packages into package.json.

Options:

  -V, --version                 Output the version number.
  -d, --dir <path>              Directory path where the yarn.lock file is located (default to current directory).
  -p, --dirPackageJson <path>   Directory of project with target package.json, if not set, -d will be used.
  -s, --save                    By default don't override the package.json file, make a new one instead package.json.yarn.
  -k, --keepPrefix              By default the ^ or any other dynamic numbers are removed and replaced with static ones.
  -g, --keepGit                 By default direct git repositories are also replaced by the version written in yarn.
  -l, --keepLink                By default direct link: repositories are also replaced by the version written in yarn.
  -a, --keepVariable <variable> By default everything is converted to yarn version. Write a part of the type you wish not to convert, separate by comma if more than one. To not replace git and link you would use +,link:.
  -h, --help                    Output usage information.

Example:
// Run this command in folder with a package.json file.
npx syncpackagejson --keepPrefix --save
```

## Credits

This is a fork of [syncyarnlock](https://github.com/vasilevich/sync-yarnlock-into-packagejson).
