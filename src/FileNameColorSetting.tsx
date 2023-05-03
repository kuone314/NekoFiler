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
  static first = 1;
  static latest = FileNameColorSettingVersiton.first;
}

export async function readFileNameColorSetting(): Promise<FileNameColorSetting[]> {
  const settingStr = await invoke<String>("read_setting_file", { filename: 'file_name_color.json5' })
    .catch(_ => "");
  if (!settingStr || settingStr === "") { return GenerateDefaultCommandSeting(); }

  const result = JSON5.parse(settingStr.toString()) as { version: number, data: FileNameColorSetting[] };
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

  const data = JSON5.stringify({ version: FileNameColorSettingVersiton.latest, data: result }, null, 2);
  (async () => {
    await invoke<void>("write_setting_file", { filename: "file_name_color.json5", content: data })
  })();

  return result;
}

