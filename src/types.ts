export interface NpmList {
  dependencies: PackageVersionsAndUrls;
  name: string;
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
  [packageName: string]: string;
}

export interface PackageVersionsAndUrls {
  [packageName: string]: VersionAndUrl;
}

export interface VersionAndUrl {
  resolved: string;
  version: string;
}
