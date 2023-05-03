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
  const result = await invoke<String>("read_setting_file", { filename: 'tab_color.json5' });
  const read = JSON5.parse(result.toString()) as { version: number, data: TabColorSetting[] };
  return read.data;
}
