
import { DialogType } from './CommandInfo';
import { ISettingInfo, writeSettings, readSettings } from './ReadWriteSettings';

///////////////////////////////////////////////////////////////////////////////////////////////////


export type ContextMenuInfo = {
  menu_name: string,
  dialog_type: DialogType,
  command: string,
};

class Version {
  static oldest = 2;
  static latest = Version.oldest;
}

class SettingInfo implements ISettingInfo<ContextMenuInfo[]> {
  filePath = "General/context_menu.json5";
  latestVersion = Version.latest;
  IsValidVersion = (version: number) => {
    if (version < Version.oldest) { return false; }
    if (version > Version.latest) { return false; }
    return true;
  };
  UpgradeSetting = async (readVersion: number, readSetting: ContextMenuInfo[]) => readSetting;
}

export async function writeContextMenuSetting(setting: ContextMenuInfo[]) {
  writeSettings(new SettingInfo, setting);
}


export async function readContextMenuSetting(): Promise<ContextMenuInfo[]> {
  const read = await readSettings(new SettingInfo);
  return read ?? GenerateDefaultSeting();
}

///////////////////////////////////////////////////////////////////////////////////////////////////
function GenerateDefaultSeting(): ContextMenuInfo[] {

  const result: ContextMenuInfo[] = [
    {
      menu_name: 'Copy to clopboard',
      dialog_type: 'none',
      command: 'script/Copy to clopboard.ps1',
    },
    {
      menu_name: 'Cut to clopboard',
      dialog_type: 'none',
      command: 'script/Cut to clopboard.ps1',
    },
    {
      menu_name: 'Past from clopboard',
      dialog_type: 'none',
      command: 'script/Past from clopboard.ps1',
    },
    {
      menu_name: 'Copy to opposite dirctory',
      dialog_type: 'none',
      command: 'script/Copy to opposite dirctory.ps1',
    },
    {
      menu_name: 'Move to opposite dirctory',
      dialog_type: 'none',
      command: 'script/Move to opposite dirctory.ps1',
    },
    {
      menu_name: 'Delete file',
      dialog_type: 'none',
      command: 'script/Delete file.ps1',
    },
    {
      menu_name: 'Copy file path',
      dialog_type: 'none',
      command: 'script/Copy file path.ps1',
    },
    {
      menu_name: 'New File',
      dialog_type: 'multi_line',
      command: 'script/New File.ps1',
    },
    {
      menu_name: 'New Folder',
      dialog_type: 'multi_line',
      command: 'script/New Folder.ps1',
    },
    {
      menu_name: 'Rename',
      dialog_type: 'reference_selection',
      command: 'script/Rename.ps1',
    },
    {
      menu_name: 'PowerShell',
      dialog_type: 'none',
      command: 'script/StartUpPowerShell.ps1',
    },
    {
      menu_name: 'PowerShell(Admin)',
      dialog_type: 'none',
      command: 'script/StartUpAdminPowerShell.ps1',
    },
  ];

  writeContextMenuSetting(result);
  return result;
}