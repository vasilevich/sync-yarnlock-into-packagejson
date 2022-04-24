export interface NpmList {
  dependencies: PackagesInfo;
  name: string;
  /** Version without range. */
  version: string;
}

export interface PackageJson {
  dependencies?: PackageVersions;
  devDependencies?: PackageVersions;
  name: string;
  peerDependencies?: PackageVersions;
  workspaces?: any;
}

export interface PackageVersions {
  /** Version with range. */
  [packageName: string]: string;
}

export interface PackagesInfo {
  [packageName: string]: Version;
}

interface Dependencies {
  [packageName: string]: Version;
}

interface Version {
  /** Version without range. */
  version: string;
}
