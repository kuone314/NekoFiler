
import { ApplySeparator, SEPARATOR } from "./FilePathSeparator";
import { css } from "@emotion/react";
import { ISettingInfo, writeSettings, readSettings } from "./ReadWriteSettings";
import { Matcher } from "./Matcher";
import { MatchingType } from "./Matcher";
import { MatchImpl } from "./Matcher";
import { ColorCodeString } from "./ColorCodeString";

///////////////////////////////////////////////////////////////////////////////////////////////////
export type TabColorSettings = {
  settings: TabColorMatcher[],
  default: TabColor,
}

export type TabColor = {
  backGround: string;
  string: string;
  activeHightlight: string;
};

export interface TabColorMatcher {
  name: string,
  color: TabColor,
  match: Matcher
}

class Version {
  static oldest = 5;
  static add_default_color = 6;
  static latest = Version.add_default_color;
}

class SettingInfo implements ISettingInfo<TabColorSettings> {
  filePath = "device_specific/tab_color.json5";
  latestVersion = Version.latest;
  IsValidVersion = (version: number) => {
    if (version < Version.oldest) { return false; }
    if (version > Version.latest) { return false; }
    return true;
  };
  UpgradeSetting = async (readVersion: number, readSetting: TabColorSettings) => {
    let result = readSetting;
    if (readVersion < Version.add_default_color) {
      result = {
        default: defaultColor,
        settings: readSetting as any as TabColorMatcher[],
      }
    }
    return result
  };
}

export async function writeTabColorSetting(setting: TabColorSettings) {
  writeSettings(new SettingInfo, setting);
}

export async function readTabColorSetting(): Promise<TabColorSettings> {
  const read = await readSettings(new SettingInfo);
  return read ?? GenerateDefaultCommandSeting();
}

export function Match(setting: TabColorMatcher, path: string): boolean {
  const path_ary = Object.values(SEPARATOR)
    .map(separator => ApplySeparator(path, separator) + separator);
  return !!path_ary.find(path => MatchImpl(setting.match, path));
}

export function TabColor(
  setting: TabColorSettings | undefined,
  borderWidth: number,
  isActive: boolean,
  path: string
) {
  if (setting === undefined) { return css(); }

  const matched_setting = setting.settings.find(setting => Match(setting, path));
  if (!matched_setting) {
    const borderColor = (isActive) ? setting.default.activeHightlight : setting.default.backGround;
    return css({
      background: setting.default.backGround,
      color: setting.default.string,
      border: borderWidth + 'px solid ' + borderColor,
    })
  }

  const color = matched_setting.color;
  const backGround = ColorCodeString.new(color.backGround)?.val
    ?? setting.default.backGround;
  const string = ColorCodeString.new(color.string)?.val
    ?? setting.default.string;
  const activeHightlight = ColorCodeString.new(color.activeHightlight)?.val
    ?? setting.default.activeHightlight;

  const borderColor = (isActive) ? activeHightlight : backGround;
  return css({
    background: backGround,
    color: string,
    border: borderWidth + 'px solid ' + borderColor,
  })
};

///////////////////////////////////////////////////////////////////////////////////////////////////
const defaultColor = {
  backGround: "#000000",
  string: "#ffffff",
  activeHightlight: "#ff0000"
};

function GenerateDefaultCommandSeting(): TabColorSettings {
  const result: TabColorSettings = {
    default: defaultColor,
    settings: [
      {
        name: 'Drive C:',
        color: {
          backGround: '#0000ff',
          string: '',
          activeHightlight: '',
        },
        match: {
          type: MatchingType.start_with,
          string: 'C:/',
        },
      },
      {
        name: 'Drive D:',
        color: {
          backGround: '#2e5f6b',
          string: '',
          activeHightlight: '',
        },
        match: {
          type: MatchingType.start_with,
          string: 'D:/',
        },
      },
    ]
  };

  writeTabColorSetting(result);

  return result;
}

