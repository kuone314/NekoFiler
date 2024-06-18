import { invoke } from "@tauri-apps/api";

import JSON5 from 'json5'
import { ApplySeparator, SEPARATOR } from "./FilePathSeparator";
import { css } from "@emotion/react";
import { ISettingInfo, writeSettings, readSettings } from "./ReadWriteSettings";

///////////////////////////////////////////////////////////////////////////////////////////////////
export interface TabColorSetting {
  name: string,
  color: {
    backGround: string,
    string: string,
    activeHightlight: string,
  },
  match: {
    type: MatchingType,
    string: string,
  }
}

export const MatchingType = {
  regexp: "regexp",
  start_with: "start_with",
} as const;
export type MatchingType = typeof MatchingType[keyof typeof MatchingType];

class Version {
  static oldest = 5;
  static latest = Version.oldest;
}

class SettingInfo implements ISettingInfo<TabColorSetting[]> {
  filePath = "device_specific/tab_color.json5";
  latestVersion = Version.latest;
  IsValidVersion = (version: number) => {
    if (version < Version.oldest) { return false; }
    if (version > Version.latest) { return false; }
    return true;
  };
  UpgradeSetting = async (readVersion: number, readSetting: TabColorSetting[]) => readSetting;
}

export async function writeTabColorSetting(setting: TabColorSetting[]) {
  writeSettings(new SettingInfo, setting);
}

export async function readTabColorSetting(): Promise<TabColorSetting[]> {
  const read = await readSettings(new SettingInfo);
  return read ?? GenerateDefaultCommandSeting();
}

function MatchImpl(setting: TabColorSetting, path: string): boolean {
  switch (setting.match.type) {
    case MatchingType.regexp: {
      try {
        const pathRegExp = new RegExp(setting.match.string, 'i');
        return pathRegExp.test(path);
      } catch {
        // 設定ミスによる、正規表現として不正な文字列が与えられたケースへの対処
        return false;
      }
    }
    case MatchingType.start_with: {
      return path.toLowerCase().startsWith(setting.match.string.toLowerCase());
    }
  }
  return false;
}

export function Match(setting: TabColorSetting, path: string): boolean {
  const path_ary = Object.values(SEPARATOR)
    .map(separator => ApplySeparator(path, separator) + separator);
  return !!path_ary.find(path => MatchImpl(setting, path));
}

export function TabColor(
  settings: TabColorSetting[],
  borderWidth: number,
  isActive: boolean,
  path: string
) {
  const setting = settings.find(setting => Match(setting, path));
  const colorSetting = setting?.color ?? { backGround: '#ffffff', string: '#000000', activeHightlight: '#ff0000' };
  const borderColor = (isActive) ? colorSetting.activeHightlight : colorSetting.backGround;
  return css({
    background: colorSetting.backGround,
    color: colorSetting.string,
    border: borderWidth + 'px solid ' + borderColor,
  })
};

///////////////////////////////////////////////////////////////////////////////////////////////////
function GenerateDefaultCommandSeting(): TabColorSetting[] {
  const result: TabColorSetting[] = [
    {
      name: 'Drive C:',
      color: {
        backGround: '#ffff00',
        string: '#000000',
        activeHightlight: '#ff0000',
      },
      match: {
        type: MatchingType.start_with,
        string: 'C:/',
      },
    },
    {
      name: 'Drive D:',
      color: {
        backGround: '#00ff00',
        string: '#000000',
        activeHightlight: '#ff0000',
      },
      match: {
        type: MatchingType.start_with,
        string: 'D:/',
      },
    },
  ];

  writeTabColorSetting(result);

  return result;
}

