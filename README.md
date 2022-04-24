# syncpackagejson

Sync installed versions of npm packages into package.json.

## Usage

```shell
Usage: npx syncpackagejson

Sync installed versions of npm packages into package.json.
```

## To Do

- Add tests.
- Release version 0.1.
- Add command line args using [yargs](https://github.com/yargs/yargs) or something similar.
- Explain how this little program works here in the readme.
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
