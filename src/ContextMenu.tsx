
import { readShellCommandSetting } from './CommandInfo';
import { readKeyBindSetting } from './KeyBindInfo';
import { ISettingInfo, writeSettings, readSettings } from './ReadWriteSettings';

///////////////////////////////////////////////////////////////////////////////////////////////////


export type ContextMenuInfo = {
  display_name: string,
  command_name: string,
};

class Version {
  static oldest = 2;
  static separet_commands_setting = 3;
  static rename_variable = 4;
  static latest = Version.rename_variable;
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
    if (readVersion < Version.rename_variable) {
      result.forEach(oldSetting => {
        oldSetting.display_name = (oldSetting as any).menu_name;
        delete (oldSetting as any).menu_name;
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
      display_name: 'Copy to clopboard',
      command_name: 'Copy to clopboard',
    },
    {
      display_name: 'Cut to clopboard',
      command_name: 'Cut to clopboard',
    },
    {
      display_name: 'Past from clopboard',
      command_name: 'Past from clopboard',
    },
    {
      display_name: 'Copy to opposite dirctory',
      command_name: 'Copy to opposite dirctory',
    },
    {
      display_name: 'Move to opposite dirctory',
      command_name: 'Move to opposite dirctory',
    },
    {
      display_name: 'Delete file',
      command_name: 'Delete file',
    },
    {
      display_name: 'Copy file path',
      command_name: 'Copy file path',
    },
    {
      display_name: 'New File',
      command_name: 'New File',
    },
    {
      display_name: 'New Folder',
      command_name: 'New Folder',
    },
    {
      display_name: 'Rename',
      command_name: 'Rename',
    },
    {
      display_name: 'PowerShell',
      command_name: 'PowerShell',
    },
    {
      display_name: 'PowerShell(Admin)',
      command_name: 'PowerShell(Admin)',
    },
  ];

  writeContextMenuSetting(result);
  return result;
}