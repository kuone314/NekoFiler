import { invoke } from '@tauri-apps/api';

import JSON5 from 'json5'
import { ISettingInfo, writeSettings, readSettings } from './ReadWriteSettings';

///////////////////////////////////////////////////////////////////////////////////////////////////
export interface FileNameColorSetting {
  color: string,
  matching: {
    isDirectory: boolean,
    fileNameRegExp: string,
  },
}

class Version {
  static oldest = 2;
  static latest = Version.oldest;
}


class SettingInfo implements ISettingInfo<FileNameColorSetting[]> {
  filePath = "General/file_name_color.json5";
  latestVersion = Version.latest;
  IsValidVersion = (version: number) => {
    if (version < Version.oldest) { return false; }
    if (version > Version.latest) { return false; }
    return true;
  };
  UpgradeSetting = async (readVersion: number, readSetting: FileNameColorSetting[]) => readSetting;
}

export async function writeFileNameColorSetting(setting: FileNameColorSetting[]) {
  writeSettings(new SettingInfo, setting);
}

export async function readFileNameColorSetting(): Promise<FileNameColorSetting[]> {
  const read = await readSettings(new SettingInfo);
  return read ?? GenerateDefaultCommandSeting();
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

