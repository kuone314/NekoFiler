import { invoke } from "@tauri-apps/api";
import JSON5 from 'json5'

// ///////////////////////////////////////////////////////////////////////////////////////////////////
export interface ISettingInfo<Setting> {
  filePath: string,
  latestVersion: number,
  IsValidVersion: (version: number) => boolean,
  UpgradeSetting: (readVersion: number, readSetting: Setting) => Promise<Setting>,
}

export async function writeSettings<Setting>(
  settingInfo: ISettingInfo<Setting>,
  setting: Setting
) {
  const data = JSON5.stringify(
    {
      version: settingInfo.latestVersion,
      data: setting
    },
    null,
    2);
  await invoke<String>(
    "write_setting_file",
    {
      filename: settingInfo.filePath,
      content: data
    });
}

///////////////////////////////////////////////////////////////////////////////////////////////////
export async function readSettings<Setting>(
  settingInfo: ISettingInfo<Setting>
): Promise<Setting | null> {
  try {
    const settingStr = await readSettingStr(settingInfo.filePath);
    if (settingStr === "") { return null; }

    const read = JSON5.parse(settingStr.toString()) as {
      version: number,
      data: Setting,
    };
    if (!settingInfo.IsValidVersion(read.version)) { return null; }

    const result = await settingInfo.UpgradeSetting(read.version, read.data);
    if (read.version < settingInfo.latestVersion) {
      writeSettings(settingInfo, result);
    }

    return result;
  } catch {
    return null;
  }
}

async function readSettingStr(filePath: string)
  : Promise<string> {
  const result = await invoke<string | null>(
    "read_setting_file",
    {
      filename: filePath,
    })
    .catch(_ => "");
  return result ?? "";
}
