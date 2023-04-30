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
  static latest = CommandInfoVersiton.add_valid_on_addressbar;
}

export async function readCommandsSetting(): Promise<CommandInfo[]> {
  const setting_str = await invoke<String>("read_setting_file", { filename: "key_bind.json5" });
  const setting_ary = JSON5.parse(setting_str.toString()) as { version: number, data: CommandInfo[] };
  if (setting_ary.version > CommandInfoVersiton.latest) { return []; }

  if (setting_ary.version < CommandInfoVersiton.add_valid_on_addressbar) {
    setting_ary.data
      .forEach(v1 => v1.valid_on_addressbar = false);
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
): [JSX.Element, ExecShellCommand,] {
  const dlg: React.MutableRefObject<HTMLDialogElement | null> = useRef(null);
  const [title, setTitle] = useState<string>('');
  const [dlgString, setDlgString] = useState<string>('');
  const [refString, setRefString] = useState<string>('');
  const dlgOnOk = useRef<(dlgInput: string) => void>(() => { });

  const execShellCommandImpl = (
    command_line: string,
    current_dir: string,
    selecting_item_name_ary: string[],
    dialog_input_string: string,
    opposite_dir: string,
    separator: separator,
  ) => {
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
