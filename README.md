# syncpackagejson

Synchronize installed versions of Node.js dependencies as specified in package-lock.json into package.json.

This program works by looking up the installed version of each dependency in package-lock.json, and then writing that version into package.json.

## Usage

The intended usage is to combine this lille script with `npm upgrade`. The following command will update all dependencies and transitive dependencies to their latest versions and then synchronize the installed versions into `package.json`.

```json
{
  "scripts": {
    "update-dependencies": "npm upgrade && npx syncpackagejson && npm install"
  }
}
```

## To Do

- Add a changelog.
- Add more tests.
- Make the code more robust.
- Add support for all kinds of semver ranges.
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
