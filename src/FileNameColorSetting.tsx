import { invoke } from '@tauri-apps/api';

import JSON5 from 'json5'

///////////////////////////////////////////////////////////////////////////////////////////////////
export interface FileNameColorSetting {
  color: string,
  matching: {
    isDirectory: boolean,
    fileNameRegExp: string,
  },
}

export async function readFileNameColorSetting(): Promise<FileNameColorSetting[]> {
  const settingStr = await invoke<String>("read_setting_file", { filename: 'file_name_color.json5' });
  const result = JSON5.parse(settingStr.toString()) as { version: number, data: FileNameColorSetting[] };
  return result.data;
}
