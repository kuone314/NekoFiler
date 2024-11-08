import { ISettingInfo, writeSettings, readSettings } from "./ReadWriteSettings";

///////////////////////////////////////////////////////////////////////////////////////////////////
export type BaseColorSetting = {
  backgroundColor: string;
  elementDefaultColor: string;
  elementHilightColor: string;
  elementSelectionColor: string;
  stringDefaultColor: string;
  stringDisabledColor: string;
  stringErrorColor: string;
};

export function DefaultBaseColorSetting(): BaseColorSetting {
  return {
    backgroundColor: '#000000',
    elementDefaultColor: '#303030',
    elementHilightColor: '#555555',
    elementSelectionColor: '#336ee6',
    stringDefaultColor: '#ffffff',
    stringDisabledColor: '#c0c0c0',
    stringErrorColor: '#ff0000',
  };
}
class Version {
  static oldest = 1;
  static latest = Version.oldest;
}
class SettingInfo implements ISettingInfo<BaseColorSetting> {
  filePath = "general/base_color.json5";
  latestVersion = Version.latest;
  IsValidVersion = (version: number) => {
    if (version < Version.oldest) { return false; }
    if (version > Version.latest) { return false; }
    return true;
  };
  UpgradeSetting = async (_readVersion: number, readSetting: BaseColorSetting) => {
    let result = readSetting;
    return result;
  };
}

export async function writeBaseColor(setting: BaseColorSetting) {
  writeSettings(new SettingInfo, setting);
}

export async function readBaseColor(): Promise<BaseColorSetting> {
  const read = await readSettings(new SettingInfo);
  const result = read ?? DefaultBaseColorSetting();
  return result;
}
