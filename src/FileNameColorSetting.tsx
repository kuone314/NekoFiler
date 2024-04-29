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

class FileNameColorSettingVersiton {
  static add_directry_hierarchy = 2;
  static latest = FileNameColorSettingVersiton.add_directry_hierarchy;
}

export async function writeFileNameColorSetting(setting: FileNameColorSetting[]) {
  const data = JSON5.stringify({ version: FileNameColorSettingVersiton.latest, data: setting }, null, 2);
  await invoke<String>(
    "write_setting_file", { filename: "General/file_name_color.json5", content: data });
}

async function readFileNameColorSettingStr(): Promise<string> {
  const result = await invoke<string | null>("read_setting_file", { filename: "General/file_name_color.json5" })
    .catch(_ => "");
  return result ?? "";
}

export async function readFileNameColorSetting(): Promise<FileNameColorSetting[]> {
  const settingStr = await readFileNameColorSettingStr();
  if (settingStr === "") { return GenerateDefaultCommandSeting(); }

  const result = JSON5.parse(settingStr.toString()) as { version: number, data: FileNameColorSetting[] };
  if (result.version < FileNameColorSettingVersiton.latest) {
    writeFileNameColorSetting(result.data);
  }

  return result.data;
}

///////////////////////////////////////////////////////////////////////////////////////////////////
function GenerateDefaultCommandSeting(): FileNameColorSetting[] {
  const result: FileNameColorSetting[] = [
    {
      matching: {
        isDirectory: true,
        fileNameRegExp: '.*',
      },
      color: '#D9845D',
    },
    {
      matching: {
        isDirectory: false,
        fileNameRegExp: '\\.md',
      },
      color: '#2A63C1',
    },
    {
      matching: {
        isDirectory: false,
        fileNameRegExp: '\\.txt',
      },
      color: '#2A636E',
    },
    {
      matching: {
        isDirectory: false,
        fileNameRegExp: '\\.exe',
      },
      color: '#09870B',
    },
    {
      matching: {
        isDirectory: false,
        fileNameRegExp: '\\.pdb',
      },
      color: '#44A64E',
    },
    {
      matching: {
        isDirectory: false,
        fileNameRegExp: '\\.dll',
      },
      color: '#2C8500',
    },
    {
      matching: {
        isDirectory: false,
        fileNameRegExp: '\\.lib',
      },
      color: '#8D8500',
    },
  ];

  writeFileNameColorSetting(result);
  return result;
}

