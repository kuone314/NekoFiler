
import { invoke } from '@tauri-apps/api';
import { CommandInfo, CommandType, DialogType } from './CommandInfo';
import JSON5 from 'json5'

///////////////////////////////////////////////////////////////////////////////////////////////////


export type ContextMenuInfo = {
  menu_name: string,
  dialog_type: DialogType,
  command: string,
};

class ContextMenuInfoVersiton {
  static first = 1;
  static latest = ContextMenuInfoVersiton.first;
}

export async function writeContextMenuSetting(setting: ContextMenuInfo[]) {
  const data = JSON5.stringify({ version: ContextMenuInfoVersiton.latest, data: setting }, null, 2);
  await invoke<String>(
    "write_setting_file", { filename: "context_menu.json5", content: data });
}

export async function readContextMenuSetting(): Promise<ContextMenuInfo[]> {
  const setting_str = await invoke<String>("read_setting_file", { filename: "context_menu.json5" })
    .catch(_ => "");
  if (!setting_str || setting_str === "") { return GenerateDefaultSeting(); }

  const setting_ary = JSON5.parse(setting_str.toString()) as { version: number, data: ContextMenuInfo[] };
  if (setting_ary.version > ContextMenuInfoVersiton.latest) { return []; }

  if (setting_ary.version < ContextMenuInfoVersiton.latest) {
    const data = JSON5.stringify({ version: ContextMenuInfoVersiton.latest, data: setting_ary.data }, null, 2);
    await invoke<String>(
      "write_setting_file", { filename: "context_menu.json5", content: data });
  }

  return setting_ary.data;
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
  return result;
}