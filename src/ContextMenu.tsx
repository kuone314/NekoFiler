
import { readShellCommandSetting } from './CommandInfo';
import { readKeyBindSetting } from './KeyBindInfo';
import { ISettingInfo, writeSettings, readSettings } from './ReadWriteSettings';

///////////////////////////////////////////////////////////////////////////////////////////////////


export type ContextMenuInfo = {
  menu_name: string,
  command_name: string,
};

class Version {
  static oldest = 2;
  static separet_commands_setting = 3;
  static latest = Version.separet_commands_setting;
}

class SettingInfo implements ISettingInfo<ContextMenuInfo[]> {
  filePath = "General/context_menu.json5";
  latestVersion = Version.latest;
  IsValidVersion = (version: number) => {
    if (version < Version.oldest) { return false; }
    if (version > Version.latest) { return false; }
    return true;
  };
  UpgradeSetting = async (readVersion: number, readSetting: ContextMenuInfo[]) => {
    let result = readSetting;
    if (readVersion < Version.separet_commands_setting) {
      await readKeyBindSetting();
      const commands = await readShellCommandSetting();
      result.forEach(oldSetting => {
        const script_path = (oldSetting as any).command;
        const command = commands.find(command => command.script_path === script_path);
        if (command === undefined) { return; }
        oldSetting.command_name = command.command_name;
        delete (oldSetting as any).dialog_type;
        delete (oldSetting as any).command;
      });
    }
    return result;
  };
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
      command_name: 'Copy to clopboard',
    },
    {
      menu_name: 'Cut to clopboard',
      command_name: 'Cut to clopboard',
    },
    {
      menu_name: 'Past from clopboard',
      command_name: 'Past from clopboard',
    },
    {
      menu_name: 'Copy to opposite dirctory',
      command_name: 'Copy to opposite dirctory',
    },
    {
      menu_name: 'Move to opposite dirctory',
      command_name: 'Move to opposite dirctory',
    },
    {
      menu_name: 'Delete file',
      command_name: 'Delete file',
    },
    {
      menu_name: 'Copy file path',
      command_name: 'Copy file path',
    },
    {
      menu_name: 'New File',
      command_name: 'New File',
    },
    {
      menu_name: 'New Folder',
      command_name: 'New Folder',
    },
    {
      menu_name: 'Rename',
      command_name: 'Rename',
    },
    {
      menu_name: 'PowerShell',
      command_name: 'StartUpPowerShell',
    },
    {
      menu_name: 'PowerShell(Admin)',
      command_name: 'StartUpAdminPowerShell',
    },
  ];

  writeContextMenuSetting(result);
  return result;
}