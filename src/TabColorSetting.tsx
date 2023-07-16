import { invoke } from "@tauri-apps/api";

import JSON5 from 'json5'
import { ApplySeparator, SEPARATOR } from "./FilePathSeparator";

///////////////////////////////////////////////////////////////////////////////////////////////////
export interface TabColorSetting {
  color: {
    backGround: string,
    string: string,
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
  static latest = TabColorSettingVersiton.add_start_with;
}

export async function readTabColorSetting(): Promise<TabColorSetting[]> {
  try {
    const settingStr = await invoke<String>("read_setting_file", { filename: 'tab_color.json5' })
      .catch(_ => "");
    if (!settingStr || settingStr === "") { return GenerateDefaultCommandSeting(); }

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

    if (result.version < TabColorSettingVersiton.latest) {
      const data = JSON5.stringify({ version: TabColorSettingVersiton.latest, data: result.data }, null, 2);
      await invoke<String>(
        "write_setting_file", { filename: "tab_color.json5", content: data });
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

///////////////////////////////////////////////////////////////////////////////////////////////////
function GenerateDefaultCommandSeting(): TabColorSetting[] {
  const result: TabColorSetting[] = [
    {
      color: {
        backGround: '#ffff00',
        string: '#000000',
      },
      match: {
        type: TabColorMatchingType.start_with,
        string: 'C:/',
      },
    },
    {
      color: {
        backGround: '#00ff00',
        string: '#000000',
      },
      match: {
        type: TabColorMatchingType.start_with,
        string: 'D:/',
      },
    },
  ];

  const data = JSON5.stringify({ version: TabColorSettingVersiton.latest, data: result }, null, 2);
  (async () => {
    await invoke<void>("write_setting_file", { filename: "tab_color.json5", content: data })
  })();

  return result;
}

