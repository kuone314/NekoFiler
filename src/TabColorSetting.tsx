import { invoke } from "@tauri-apps/api";

import JSON5 from 'json5'

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
  if (!settingStr ||settingStr === "") { return GenerateDefaultCommandSeting(); }

  const result = JSON5.parse(settingStr.toString()) as { version: number, data: TabColorSetting[] };
  return result.data;
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

