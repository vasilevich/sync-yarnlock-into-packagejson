export interface NpmList {
  dependencies: PackageVersionsAndUrls;
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

export interface PackageVersionsAndUrls {
  [packageName: string]: VersionAndUrl;
}

export interface VersionAndUrl {
  resolved: string;
  /** Version without range. */
  version: string;
}
