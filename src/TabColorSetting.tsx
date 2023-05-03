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

export async function readTabColorSetting(): Promise<TabColorSetting[]> {
  const settingStr = await invoke<String>("read_setting_file", { filename: 'tab_color.json5' });
  const result = JSON5.parse(settingStr.toString()) as { version: number, data: TabColorSetting[] };
  return result.data;
}
