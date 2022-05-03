# syncpackagejson

Synchronize installed versions of npm packages as specified in package-lock.json into package.json.

This program works by looking up the installed versions of each packages in package-lock.json, and then updating package.json with the version that is actually installed.

## Usage

The intended usage is to combine this lille script with `npm upgrade`. You can add the following run script to `package.json`...

```json
{
  "scripts": {
    "update-packages": "npm upgrade && npx syncpackagejson"
  }
}
```

... and then run the following command to update all packages and transitive packages to their latest versions and then synchronize the installed versions into `package.json`.

```shell
npm run update-packages
```

## To Do

- Add more tests.
- Make the code more robust.
- Try restructuring the code using an object oriente approach.
- Add command line args using [yargs](https://github.com/yargs/yargs) or something similar.
- Add support for workspaces. See code snippet below.
- More error checking like Yarn being used instead of npm.

### Original Workspace Code

```typescript
if (originalPackageJson.workspaces) {
  const packagePaths =
    originalPackageJson.workspaces.packages || originalPackageJson.workspaces;
  if (Array.isArray(packagePaths)) {
    for (const packagePath of packagePaths) {
      const packages = glob.sync(
        `${packagePath}${packagePath.endsWith("/") ? "" : "/"}`,
        { absolute: true }
      );
      for (const workspaceDir of packages) {
        const workspacePackageJson = path.join(workspaceDir, "package.json");
        await updatePackageJson(workspacePackageJson, installedPackages);
      }
    }
  }
}
```

## Credits

This is a fork of [syncyarnlock](https://github.com/vasilevich/sync-yarnlock-into-packagejson).
