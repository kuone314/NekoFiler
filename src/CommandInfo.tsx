import { invoke } from '@tauri-apps/api';
import JSON5 from 'json5'

import { executeShellCommand } from './RustFuncs';
import { separator, ApplySeparator } from './FilePathSeparator';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'

import { useEffect, useRef, useState } from 'react';
import React from 'react';

///////////////////////////////////////////////////////////////////////////////////////////////////
export const COMMAND_TYPE = {
  build_in: "build_in",
  power_shell: "power_shell",
} as const;
type CommandType = typeof COMMAND_TYPE[keyof typeof COMMAND_TYPE];

export const DIALOG_TYPE = {
  none: "none",
  multi_line: "multi_line",
  reference_selection: "reference_selection",
} as const;
export type DialogType = typeof DIALOG_TYPE[keyof typeof DIALOG_TYPE];


export type CommandInfo = {
  command_name: string,
  key: string,
  valid_on_addressbar: boolean,
  dialog_type: DialogType,
  action: {
    type: CommandType,
    command: string,
  }
};

///////////////////////////////////////////////////////////////////////////////////////////////////
export function match(keyboard_event: React.KeyboardEvent<HTMLDivElement>, command_key: string): boolean {
  const key_ary = command_key.split('+').map(key => key.toLocaleLowerCase());
  if (key_ary.includes('ctrl') !== keyboard_event.ctrlKey) { return false; }
  if (key_ary.includes('alt') !== keyboard_event.altKey) { return false; }
  if (key_ary.includes('shift') !== keyboard_event.shiftKey) { return false; }

  const setting_key = key_ary[key_ary.length - 1].toLocaleLowerCase();
  if (setting_key === keyboard_event.key.toLocaleLowerCase()) { return true; }
  if (keyboard_event.key === ' ' && setting_key === 'space') { return true; }

  return false;
}

class CommandInfoVersiton {
  static first = 1;
  static add_valid_on_addressbar = 2;
  static read_script_from_file = 3;
  static latest = CommandInfoVersiton.read_script_from_file;
}

export async function readCommandsSetting(): Promise<CommandInfo[]> {
  const setting_str = await invoke<String>("read_setting_file", { filename: "key_bind.json5" })
    .catch(_ => "");
  if (!setting_str || setting_str === "") { return GenerateDefaultCommandSeting(); }


  const setting_ary = JSON5.parse(setting_str.toString()) as { version: number, data: CommandInfo[] };
  if (setting_ary.version > CommandInfoVersiton.latest) { return []; }

  if (setting_ary.version < CommandInfoVersiton.add_valid_on_addressbar) {
    setting_ary.data
      .forEach(v1 => v1.valid_on_addressbar = false);
  }

  if (setting_ary.version < CommandInfoVersiton.read_script_from_file) {
    const shellCommands = setting_ary.data
      .filter(setting => setting.action.type === COMMAND_TYPE.power_shell);
    for (const setting of shellCommands) {
      await invoke<String>(
        "write_setting_file",
        { filename: setting.command_name + ".ps1", content: setting.action.command });
      setting.action.command = setting.command_name + ".ps1";
    }
  }

  if (setting_ary.version < CommandInfoVersiton.latest) {
    const data = JSON5.stringify({ version: CommandInfoVersiton.latest, data: setting_ary.data }, null, 2);
    await invoke<String>(
      "write_setting_file", { filename: "key_bind.json5", content: data });
  }

  return setting_ary.data;
}

///////////////////////////////////////////////////////////////////////////////////////////////////
function decoratePath(path: String): string {
  return '"' + path + '"';
}

///////////////////////////////////////////////////////////////////////////////////////////////////
type ExecShellCommand = (
  command: CommandInfo,
  current_dir: string,
  selecting_item_name_ary: string[],
  opposite_path: string,
  separator: separator,
) => void;

export function commandExecuter(
  onDialogClose: () => void,
  addLogMessage: (message: string) => void,
): [JSX.Element, ExecShellCommand,] {
  const dlg: React.MutableRefObject<HTMLDialogElement | null> = useRef(null);
  const [title, setTitle] = useState<string>('');
  const [dlgString, setDlgString] = useState<string>('');
  const [refString, setRefString] = useState<string>('');
  const dlgOnOk = useRef<(dlgInput: string) => void>(() => { });

  const execShellCommandImpl = async (
    script_file_name: string,
    current_dir: string,
    selecting_item_name_ary: string[],
    dialog_input_string: string,
    opposite_dir: string,
    separator: separator,
  ) => {
    const command_line = await invoke<String>("read_setting_file", { filename: script_file_name });

    const path_ary = selecting_item_name_ary
      .map(path => decoratePath(current_dir + separator + path))
      .join(',');
    const name_ary = selecting_item_name_ary
      .map(decoratePath)
      .join(',');
    const dialog_input_string_ary = dialog_input_string
      .split(/\n/)
      .map(decoratePath)
      .join(',');
    const current_dir_def = `$current_dir = "${current_dir}";`;
    const opposite_dir_def = `$opposite_dir = "${opposite_dir}";`;
    const path_ary_def = `$selecting_item_path_ary = @(${path_ary});`;
    const name_ary_def = `$selecting_item_name_ary = @(${name_ary});`;
    const dialog_input_def = `$dialog_input_str_ary = @(${dialog_input_string_ary});`;

    const command_strs = [path_ary_def, name_ary_def, current_dir_def, opposite_dir_def, dialog_input_def, command_line,];
    const replaced_command_line = command_strs.join('\n');
    console.log(replaced_command_line)
    executeShellCommand(replaced_command_line, current_dir);
  }
  const execShellCommand = (
    command: CommandInfo,
    current_dir: string,
    selecting_item_name_ary: string[],
    opposite_dir: string,
    separator: separator,
  ) => {
    const fn = (dialog_input_string: string) => {
      execShellCommandImpl(
        command.action.command,
        ApplySeparator(current_dir, separator),
        selecting_item_name_ary,
        dialog_input_string,
        ApplySeparator(opposite_dir, separator),
        separator
      );
    }

    const type = command.dialog_type;
    if (!type || type === DIALOG_TYPE.none) {
      fn('');
      return;
    }
    if (type === DIALOG_TYPE.reference_selection || type === DIALOG_TYPE.multi_line) {
      setTitle(command.command_name);
      const str = (type === DIALOG_TYPE.reference_selection)
        ? selecting_item_name_ary.join('\n')
        : '';
      setDlgString(str);
      setRefString(str);
      dlg.current?.showModal();
      dlgOnOk.current = fn;
      return;
    }
  }

  const [textareaInitFlag, setTextareaInitFlag] = useState<boolean>(false);
  useEffect(() => {
    textarea.current?.focus()
  }, [dlg.current?.open]);

  const countTextRows = (str: string) => {
    return str.split('\n').length;
  }

  const textarea = React.createRef<HTMLTextAreaElement>();


  const sizeHalf =
    css({
      height: '100%',
      width: '50%',
    });

  const textAreaWhithRef = () => {
    return <div
      css={css({
        display: 'flex',
        flexDirection: 'row',
      })}
    >
      <textarea
        value={refString}
        disabled={true}
        rows={countTextRows(refString)}
        css={sizeHalf}
      />
      <textarea
        value={dlgString}
        onChange={e => {
          if (!textareaInitFlag) { setTextareaInitFlag(true); return; } // この処理が無いと、何故か、ダイアログの文字列に、空行が入る…。
          setDlgString(e.target.value);
        }}
        rows={countTextRows(refString)}
        css={sizeHalf}
        ref={textarea}
      />
    </div>
  }
  const textArea = () => {
    return <div
      css={css({
        display: 'grid',
        gridTemplateRows: '1fr',
      })}
    >
      <textarea
        css={css({
          display: 'grid',
          gridTemplateRows: '1fr',
        })}
        value={dlgString}
        onChange={e => {
          if (!textareaInitFlag) { setTextareaInitFlag(true); return; } // この処理が無いと、何故か、ダイアログの文字列に、空行が入る…。
          setDlgString(e.target.value);
        }}
        ref={textarea}
      />
    </div>
  }
  const button = () => {
    return <div
      css={css({
        marginLeft: 'auto',
        marginRight: 'auto',
      })}
    >
      <button
        onClick={() => { dlgOnOk.current(dlgString); dlg.current?.close() }}
      >
        Ok
      </button>
      <button
        onClick={() => { setDlgString(''); dlg.current?.close() }}
      >
        Cancle
      </button>
    </div>
  }

  const element = <dialog
    css={css({
      width: '80%',
      height: '80%',
    })}
    ref={dlg}
    onClose={() => { onDialogClose(); setTextareaInitFlag(false); }}
  >
    <div
      css={css({
        display: 'grid',
        gridTemplateRows: 'auto 1fr auto',
        margin: '0 auto',
        width: '90%',
        height: '100%',
      })}
    >
      <div
        css={css({
          marginLeft: 'auto',
          marginRight: 'auto',
        })}
      >
        {title}
      </div>
      {(refString.length === 0) ? textArea() : textAreaWhithRef()}
      {button()}
    </div>
  </dialog>

  return [element, execShellCommand];
}

///////////////////////////////////////////////////////////////////////////////////////////////////
function GenerateDefaultCommandSeting(): CommandInfo[] {
  const result: CommandInfo[] = [
    {
      command_name: 'Copy to clopboard',
      key: 'ctrl+c',
      dialog_type: 'none',
      action: {
        type: 'power_shell',
        command: 'script/Copy to clopboard.ps1',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'Cut to clopboard',
      key: 'ctrl+x',
      dialog_type: 'none',
      action: {
        type: 'power_shell',
        command: 'script/Cut to clopboard.ps1',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'Past from clopboard',
      key: 'ctrl+v',
      dialog_type: 'none',
      action: {
        type: 'power_shell',
        command: 'script/Past from clopboard.ps1',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'Create Copy',
      key: 'ctrl+c',
      dialog_type: 'reference_selection',
      action: {
        type: 'power_shell',
        command: 'script/Create Copy.ps1',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'Copy to opposite dirctory',
      key: 'ctrl+c',
      dialog_type: 'none',
      action: {
        type: 'power_shell',
        command: 'script/Copy to opposite dirctory.ps1',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'Move to opposite dirctory',
      key: 'ctrl+x',
      dialog_type: 'none',
      action: {
        type: 'power_shell',
        command: 'script/Move to opposite dirctory.ps1',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'Delete file',
      key: 'ctrl+d',
      dialog_type: 'none',
      action: {
        type: 'power_shell',
        command: 'script/Delete file.ps1',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: '',
      key: 'ctrl+d',
      dialog_type: 'none',
      action: {
        type: 'power_shell',
        command: '',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'Delete file',
      key: 'delete',
      dialog_type: 'none',
      action: {
        type: 'power_shell',
        command: 'script/Delete file.ps1',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'Copy file path',
      key: 'ctrl+alt+c',
      dialog_type: 'none',
      action: {
        type: 'power_shell',
        command: 'script/Copy file path.ps1',
      },
      valid_on_addressbar: true,
    },
    {
      command_name: 'New File',
      key: 'ctrl+n',
      dialog_type: 'multi_line',
      action: {
        type: 'power_shell',
        command: 'script/New File.ps1',
      },
      valid_on_addressbar: true,
    },
    {
      command_name: 'New Folder',
      key: 'ctrl+n',
      dialog_type: 'multi_line',
      action: {
        type: 'power_shell',
        command: 'script/New Folder.ps1',
      },
      valid_on_addressbar: true,
    },
    {
      command_name: 'Rename',
      key: 'ctrl+n',
      dialog_type: 'reference_selection',
      action: {
        type: 'power_shell',
        command: 'script/Rename.ps1',
      },
      valid_on_addressbar: true,
    },
    {
      command_name: 'moveDown',
      key: 'ArrowDown',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'moveDown',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'moveDownSelect',
      key: 'shift+ArrowDown',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'moveDownSelect',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'moveUp',
      key: 'ArrowUp',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'moveUp',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'moveUpSelect',
      key: 'shift+ArrowUp',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'moveUpSelect',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'moveTop',
      key: 'Home',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'moveTop',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'moveTopSelect',
      key: 'shift+Home',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'moveTopSelect',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'moveBottom',
      key: 'End',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'moveBottom',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'moveBottomSelect',
      key: 'shift+End',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'moveBottomSelect',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'selectAll',
      key: 'ctrl+a',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'selectAll',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'toggleSelection',
      key: 'Space',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'toggleSelection',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'addNewTab',
      key: 'ctrl+t',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'addNewTab',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'removeTab',
      key: 'ctrl+w',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'removeTab',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'toPrevTab',
      key: 'ctrl+shift+tab',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'toPrevTab',
      },
      valid_on_addressbar: true,
    },
    {
      command_name: 'toNextTab',
      key: 'ctrl+tab',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'toNextTab',
      },
      valid_on_addressbar: true,
    },
    {
      command_name: 'toPrevTab',
      key: 'ctrl+shift+ArrowLeft',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'toPrevTab',
      },
      valid_on_addressbar: true,
    },
    {
      command_name: 'toNextTab',
      key: 'ctrl+Shift+ArrowRight',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'toNextTab',
      },
      valid_on_addressbar: true,
    },
    {
      command_name: 'accessCurrentItem',
      key: 'Enter',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'accessCurrentItem',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'accessParentDir',
      key: 'ctrl+shift+ArrowUp',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'accessParentDir',
      },
      valid_on_addressbar: true,
    },
    {
      command_name: 'focusAddoressBar',
      key: 'ctrl+l',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'focusAddoressBar',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'focusOppositePain',
      key: 'tab',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'focusOppositePain',
      },
      valid_on_addressbar: true,
    },
  ];

  const data = JSON5.stringify({ version: CommandInfoVersiton.latest, data: result }, null, 2);
  (async () => {
    await invoke<void>("write_setting_file", { filename: "key_bind.json5", content: data })
  })();

  (async () => {
    const script = '\
Set-Clipboard $selecting_item_path_ary;\
';
    await invoke<void>("write_setting_file", {
      filename: "script/Copy file path.ps1",
      content: script
    })
  })();

  (async () => {
    const script = '\
Add-Type -AssemblyName System.Windows.Forms;\
$dataObj = New-Object System.Windows.Forms.DataObject;\
$dataObj.SetFileDropList($selecting_item_path_ary);\
$byteStream = [byte[]](([System.Windows.Forms.DragDropEffects]::Copy -as [byte]), 0, 0, 0);\
$memoryStream = [System.IO.MemoryStream]::new($byteStream);\
$dataObj.SetData("Preferred DropEffect", $memoryStream);\
[System.Windows.Forms.Clipboard]::SetDataObject($dataObj, $true);\
';
    await invoke<void>("write_setting_file", {
      filename: "script/Copy to clopboard.ps1",
      content: script
    })
  })();

  (async () => {
    const script = '\
Copy-Item -Recurse -Path $selecting_item_path_ary -Destination $opposite_dir\
';
    await invoke<void>("write_setting_file", {
      filename: "script/Copy to opposite dirctory.ps1",
      content: script
    })
  })();

  (async () => {
    const script = '\
for ($index=0; $index -lt $selecting_item_path_ary.count; $index++){\
  $selecting_item_path = $selecting_item_path_ary[$index];\
  $dialog_input_str = $dialog_input_str_ary[$index];\
  Copy-Item -Recurse -Path $selecting_item_path -Destination $dialog_input_str\
}\
';
    await invoke<void>("write_setting_file", {
      filename: "script/Create Copy.ps1",
      content: script
    })
  })();

  (async () => {
    const script = '\
Add-Type -AssemblyName System.Windows.Forms;\
$dataObj = New-Object System.Windows.Forms.DataObject;\
$dataObj.SetFileDropList($selecting_item_path_ary);\
$byteStream = [byte[]](([System.Windows.Forms.DragDropEffects]::Move -as [byte]), 0, 0, 0);\
$memoryStream = [System.IO.MemoryStream]::new($byteStream);\
$dataObj.SetData("Preferred DropEffect", $memoryStream);\
[System.Windows.Forms.Clipboard]::SetDataObject($dataObj, $true);\
';
    await invoke<void>("write_setting_file", {
      filename: "script/Cut to clopboard.ps1",
      content: script
    })
  })();

  (async () => {
    const script = '\
Remove-Item $selecting_item_path_ary -Recurse;\
';
    await invoke<void>("write_setting_file", {
      filename: "script/Delete file.ps1",
      content: script
    })
  })();

  (async () => {
    const script = '\
Move-Item -Path $selecting_item_path_ary -Destination $opposite_dir\
';
    await invoke<void>("write_setting_file", {
      filename: "script/Move to opposite dirctory.ps1",
      content: script
    })
  })();

  (async () => {
    const script = '\
$dialog_input_str_ary | % { New-Item $_ -type file };\
';
    await invoke<void>("write_setting_file", {
      filename: "script/New File.ps1",
      content: script
    })
  })();

  (async () => {
    const script = '\
$dialog_input_str_ary | % { New-Item $_ -type Directory };\
';
    await invoke<void>("write_setting_file", {
      filename: "script/New Folder.ps1",
      content: script
    })
  })();

  (async () => {
    const script = '\
Add-Type -AssemblyName System.Windows.Forms;\
\
$files = [Windows.Forms.Clipboard]::GetFileDropList() ;\
$data = [Windows.Forms.Clipboard]::GetDataObject();\
$dropEffect = $data.GetData("Preferred DropEffect");\
$flag = $dropEffect.ReadByte();\
\
if ($flag -band [Windows.Forms.DragDropEffects]::Copy) {\
    Copy-Item $files $current_dir;\
}\
if ($flag -band [Windows.Forms.DragDropEffects]::Move) {\
    Move-Item $files $current_dir;\
}\
';
    await invoke<void>("write_setting_file", {
      filename: "script/Past from clopboard.ps1",
      content: script
    })
  })();

  (async () => {
    const script = '\
for ($index=0; $index -lt $selecting_item_path_ary.count; $index++){\
  Rename-Item $selecting_item_path_ary[$index] $dialog_input_str_ary[$index]\
}\
';
    await invoke<void>("write_setting_file", {
      filename: "script/Rename.ps1",
      content: script
    })
  })();


  return result;
}

