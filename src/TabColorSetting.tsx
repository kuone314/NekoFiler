import { invoke } from "@tauri-apps/api";

import JSON5 from 'json5'
import { ApplySeparator, SEPARATOR } from "./FilePathSeparator";
import { css } from "@emotion/react";

///////////////////////////////////////////////////////////////////////////////////////////////////
export interface TabColorSetting {
  name: string,
  color: {
    backGround: string,
    string: string,
    activeHightlight: string,
  },
  match: {
    type: TabColorMatchingType,
    string: string,
  }
}

export const TabColorMatchingType = {
  regexp: "regexp",
  start_with: "start_with",
} as const;
export type TabColorMatchingType = typeof TabColorMatchingType[keyof typeof TabColorMatchingType];

class TabColorSettingVersiton {
  static first = 1;
  static add_start_with = 2;
  static add_setting_name = 3;
  static add_frame_highlightv = 4;
  static add_directry_hierarchy = 5;
  static latest = TabColorSettingVersiton.add_directry_hierarchy;
}

export async function writeTabColorSetting(setting: TabColorSetting[]) {
  const data = JSON5.stringify({ version: TabColorSettingVersiton.latest, data: setting }, null, 2);
  await invoke<String>(
    "write_setting_file", { filename: "device_specific/tab_color.json5", content: data });
}
async function readTabColorSettingStr(): Promise<string> {
  const result = await invoke<string | null>("read_setting_file", { filename: "device_specific/tab_color.json5" })
    .catch(_ => "");
  if (result === null) {
    const oldFileStr = await invoke<string | null>("read_setting_file", { filename: 'tab_color.json5' })
      .catch(_ => "");
    if (oldFileStr !== null) { return oldFileStr; }
    return "";
  }
  return result;
}

export async function readTabColorSetting(): Promise<TabColorSetting[]> {
  try {
    const settingStr = await readTabColorSettingStr();
    if (settingStr === "") { return GenerateDefaultCommandSeting(); }

    const result = JSON5.parse(settingStr.toString()) as { version: number, data: TabColorSetting[] };
    if (result.version > TabColorSettingVersiton.latest) { return []; }

    if (result.version < TabColorSettingVersiton.add_start_with) {
      result.data.forEach(setting => {
        setting.match = {
          type: TabColorMatchingType.regexp,
          string: (setting as any).pathRegExp,
        };
        delete (setting as any).pathRegExp;
      });
    }

    if (result.version < TabColorSettingVersiton.add_setting_name) {
      result.data.forEach((setting, idx) => {
        setting.name = "Setting " + idx.toString();
      });
    }

    if (result.version < TabColorSettingVersiton.add_frame_highlightv) {
      result.data.forEach((setting, idx) => {
        setting.color.activeHightlight = '#ff0000';
      });
    }

    if (result.version < TabColorSettingVersiton.latest) {
      writeTabColorSetting(result.data);
    }
    return result.data;
  } catch {
    return GenerateDefaultCommandSeting();
  }
}

function MatchImpl(setting: TabColorSetting, path: string): boolean {
  switch (setting.match.type) {
    case TabColorMatchingType.regexp: {
      try {
        const pathRegExp = new RegExp(setting.match.string, 'i');
        return pathRegExp.test(path);
      } catch {
        // 設定ミスによる、正規表現として不正な文字列が与えられたケースへの対処
        return false;
      }
    }
    case TabColorMatchingType.start_with: {
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
        type: TabColorMatchingType.start_with,
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
        type: TabColorMatchingType.start_with,
        string: 'D:/',
      },
    },
  ];

  writeTabColorSetting(result);

  return result;
}

