
import { ISettingInfo, writeSettings, readSettings } from './ReadWriteSettings';
import { Matcher } from './Matcher';

///////////////////////////////////////////////////////////////////////////////////////////////////
export interface RowColorSetting {
  oddRowBackGroune: string;
  evenRowBackGroune: string;
  forGround: string,
  activeHightlight: string;
}

export interface FileListRowColorSetting {
  name: string,
  color: RowColorSetting,
  matcher: {
    isDirectory: boolean,
    nameMatcher: Matcher,
  },
}

export interface FileListRowColorSettings {
  settings: FileListRowColorSetting[],
  defaultColor: RowColorSetting,
  selectionColor: RowColorSetting,
}

class Version {
  static oldest = 1;
  static latest = Version.oldest;
}


class SettingInfo implements ISettingInfo<FileListRowColorSettings> {
  filePath = "general/file_name_color.json5";
  latestVersion = Version.latest;
  IsValidVersion = (version: number) => {
    if (version < Version.oldest) { return false; }
    if (version > Version.latest) { return false; }
    return true;
  };
  UpgradeSetting = async (_readVersion: number, readSetting: FileListRowColorSettings) => readSetting;
}

export async function writeFileListRowColorSetting(setting: FileListRowColorSettings) {
  writeSettings(new SettingInfo, setting);
}

export async function readFileListRowColorSetting(): Promise<FileListRowColorSettings> {
  const read = await readSettings(new SettingInfo);
  return read ?? GenerateDefaultSeting();
}

///////////////////////////////////////////////////////////////////////////////////////////////////
function GenerateDefaultSeting(): FileListRowColorSettings {
  const settings: FileListRowColorSetting[] = [
    {
      name: 'Directry',
      color: {
        oddRowBackGroune: '',
        evenRowBackGroune: '',
        forGround: '#faa629',
        activeHightlight: '',
      },
      matcher: {
        isDirectory: true,
        nameMatcher: {
          type: 'start_with',
          string: ''
        }
      },
    },
    {
      name: 'Maridown',
      color: {
        oddRowBackGroune: '',
        evenRowBackGroune: '',
        forGround: '#00ffff',
        activeHightlight: '',
      },
      matcher: {
        isDirectory: false,
        nameMatcher: {
          type: 'end_with',
          string: '.md'
        }
      },
    },
    {
      name: 'Text',
      color: {
        oddRowBackGroune: '',
        evenRowBackGroune: '',
        forGround: '#17fd91',
        activeHightlight: '',
      },
      matcher: {
        isDirectory: false,
        nameMatcher: {
          type: 'end_with',
          string: '.txt'
        }
      },
    },
    {
      name: 'exe',
      color: {
        oddRowBackGroune: '',
        evenRowBackGroune: '',
        forGround: '#ff0000',
        activeHightlight: '',
      },
      matcher: {
        isDirectory: false,
        nameMatcher: {
          type: 'end_with',
          string: '.exe'
        }
      },
    },
    {
      name: 'pdb',
      color: {
        oddRowBackGroune: '',
        evenRowBackGroune: '',
        forGround: '#ea8592',
        activeHightlight: '',
      },
      matcher: {
        isDirectory: false,
        nameMatcher: {
          type: 'end_with',
          string: '.pdb'
        }
      },
    },
    {
      name: 'dll',
      color: {
        oddRowBackGroune: '',
        evenRowBackGroune: '',
        forGround: '#ea8b97',
        activeHightlight: '',
      },
      matcher: {
        isDirectory: false,
        nameMatcher: {
          type: 'end_with',
          string: '.dll'
        }
      },
    },
    {
      name: 'lib',
      color: {
        oddRowBackGroune: '',
        evenRowBackGroune: '',
        forGround: '#ea8b97',
        activeHightlight: '',
      },
      matcher: {
        isDirectory: false,
        nameMatcher: {
          type: 'end_with',
          string: '.lib'
        }
      },
    },
  ];

  const result = {
    settings: settings,
    defaultColor: {
      oddRowBackGroune: '#242424',
      evenRowBackGroune: '#404040',
      forGround: '#ffffff',
      activeHightlight: '#880000',
    },
    selectionColor: {
      oddRowBackGroune: '#2a7fc0',
      evenRowBackGroune: '#3fabfd',
      forGround: '#000000',
      activeHightlight: '#880000',
    },
  };
  writeFileListRowColorSetting(result);
  return result;
}

