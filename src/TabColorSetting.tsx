import { invoke } from "@tauri-apps/api";

import JSON5 from 'json5'
import { ApplySeparator, SEPARATOR } from "./FilePathSeparator";

///////////////////////////////////////////////////////////////////////////////////////////////////
export interface TabColorSetting {
  color: {
    backGround: string,
    string: string,
  },
  pathRegExp: string,
}

class TabColorSettingVersiton {
  static first = 1;
  static latest = TabColorSettingVersiton.first;
}

export async function readTabColorSetting(): Promise<TabColorSetting[]> {
  const settingStr = await invoke<String>("read_setting_file", { filename: 'tab_color.json5' })
    .catch(_ => "");
  if (!settingStr || settingStr === "") { return GenerateDefaultCommandSeting(); }

  const result = JSON5.parse(settingStr.toString()) as { version: number, data: TabColorSetting[] };
  return result.data;
}

export function Match(setting: TabColorSetting, path: string): boolean {
  try {
    const pathRegExp = new RegExp(setting.pathRegExp, 'i');
    const path_ary = Object.values(SEPARATOR)
      .map(separator => ApplySeparator(path, separator) + separator);
    return !!path_ary.find(path => pathRegExp.test(path));
  } catch {
    // 設定ミスによる、正規表現として不正な文字列が与えられたケースへの対処
    return false;
  }

}

///////////////////////////////////////////////////////////////////////////////////////////////////
function GenerateDefaultCommandSeting(): TabColorSetting[] {
  const result: TabColorSetting[] = [
    {
      color: {
        backGround: '#ffff00',
        string: '#000000',
      },
      pathRegExp: '^C:/',
    },
    {
      color: {
        backGround: '#00ff00',
        string: '#000000',
      },
      pathRegExp: '^D:/',
    },
  ];

  const data = JSON5.stringify({ version: TabColorSettingVersiton.latest, data: result }, null, 2);
  (async () => {
    await invoke<void>("write_setting_file", { filename: "tab_color.json5", content: data })
  })();

  return result;
}

