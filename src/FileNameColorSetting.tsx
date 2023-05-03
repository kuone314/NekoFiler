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
  const result = await invoke<String>("read_setting_file", { filename: 'file_name_color.json5' });
  const read = JSON5.parse(result.toString()) as { version: number, data: FileNameColorSetting[] };
  return read.data;
}
