
import { ApplySeparator, SEPARATOR } from "./FilePathSeparator";
import { ISettingInfo, writeSettings, readSettings } from "./ReadWriteSettings";
import { DirName } from "./Utility";

///////////////////////////////////////////////////////////////////////////////////////////////////

export type TabNameSettings = TabNameSetting[];
export interface TabNameSetting {
  name: string,
  regexpFrom: string,
  regexpTo: string
}

class Version {
  static oldest = 1;
  static latest = Version.oldest;
}

class SettingInfo implements ISettingInfo<TabNameSettings> {
  filePath = "device_specific/tab_name.json5";
  latestVersion = Version.latest;
  IsValidVersion = (version: number) => {
    if (version < Version.oldest) { return false; }
    if (version > Version.latest) { return false; }
    return true;
  };
  UpgradeSetting = async (_: number, readSetting: TabNameSettings) => readSetting;
}

export async function writeTabNameSetting(setting: TabNameSettings) {
  writeSettings(new SettingInfo, setting);
}

export async function readTabNameSetting(): Promise<TabNameSettings> {
  const read = await readSettings(new SettingInfo);
  return read ?? GenerateDefaultSeting();
}

///////////////////////////////////////////////////////////////////////////////////////////////////

function TryReplace(
  setting: TabNameSetting,
  path: string,
): string | null {
  return Object.values(SEPARATOR)
    .map(separator => ApplySeparator(path, separator))
    .map(path => {
      const regex = new RegExp(setting.regexpFrom);
      if (!regex.test(path)) { return null; }
      return path.replace(regex, setting.regexpTo);
    })
    .find(result => result != null) ?? null;
}

export function TabName(
  setting: TabNameSettings | undefined,
  path: string
): string {
  return (setting ?? [])
    .map(setting => TryReplace(setting, path))
    .find(result => result != null)
    ?? DirName(path);
};

///////////////////////////////////////////////////////////////////////////////////////////////////

function GenerateDefaultSeting(): TabNameSettings {
  const result: TabNameSettings = [
    {
      name: "Documents",
      regexpFrom: "C:/Users/[^/]+/Documents/(([^/]+)/)*(?<dirName>[^/]+)/$",
      regexpTo: "Doc:$<dirName>"
    },
    {
      name: "Downloads",
      regexpFrom: "C:/Users/[^/]+/Downloads/(([^/]+)/)*(?<dirName>[^/]+)/$",
      regexpTo: "DL:$<dirName>"
    },
    {
      name: "node_modules",
      regexpFrom: ".*/(?<upperDir>[^/]+)/node_modules/$",
      regexpTo: "$<upperDir>/node_modules"
    },
    {
      name: "Debug/Release",
      regexpFrom: ".*/(?<upperDirs>[^/]+/[^/]+)/(?<Dir>debug|release)/$",
      regexpTo: "$<upperDirs>/$<Dir>"
    },
  ];

  writeTabNameSetting(result);

  return result;
}

