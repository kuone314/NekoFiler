import { useEffect, useRef, useState } from 'react';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import Select from 'react-select'
import { invoke } from '@tauri-apps/api/core';
import { Exist, IsValidIndex } from './Utility';
import { Button } from '@mui/material';
import { scriptDirPath, DIALOG_TYPE, DialogType, ShellCommand, writeShellCommandSetting, readShellCommandSetting, shellCommandTemplate } from './CommandInfo';
import { KeyBindSetting, readKeyBindSetting } from './KeyBindInfo';
import useInterval from 'use-interval';
import { ContextMenuInfo, readContextMenuSetting } from './ContextMenu';
import { ButtonStyle, ComboBoxStyle, TextInputStyle, useTheme } from './ThemeStyle';


///////////////////////////////////////////////////////////////////////////////////////////////////
const buttonHeight = 70;
const dlgHeightMagin = 60;

///////////////////////////////////////////////////////////////////////////////////////////////////
export function ShellCommandsSettingPane(
  props: {
    height: number,
    onOK: () => void,
  }
): [
    JSX.Element,
    () => void,
  ] {
  const [shellCommandsSettings, setShellCommandsSettings] = useState<ShellCommand[]>([]);
  useEffect(() => { (async () => { setShellCommandsSettings(await readShellCommandSetting()); })() }, []);
  function writSettings() {
    writeShellCommandSetting(shellCommandsSettings);
  }

  const dlg: React.MutableRefObject<HTMLDialogElement | null> = useRef(null);

  const [keybindCommandList, setKeybindCommandList] = useState<KeyBindSetting[] | null>(null);
  const [contextMenuCommandList, setContextMenuCommandList] = useState<ContextMenuInfo[] | null>(null);
  useEffect(() => {
    (async () => {
      const keybindCommandList = (await readKeyBindSetting())
        .filter(keybind => keybind.action.type === 'power_shell');
      setKeybindCommandList(keybindCommandList);
      const contextMenuCommandList = (await readContextMenuSetting());
      setContextMenuCommandList(contextMenuCommandList);
    })()
  }, []);
  const [editingIndex, setEditingIndex] = useState(0);

  const theme = useTheme();

  const RemoveSetting = (trgIdx: number) => {
    let newSettings = Array.from(shellCommandsSettings);
    newSettings.splice(trgIdx, 1);
    setShellCommandsSettings(newSettings);
  }

  function BindingCommandList(command_name: string): string[] | null {
    if (keybindCommandList === null || contextMenuCommandList == null) { return null; }
    const keybindCommandNameList = keybindCommandList
      .filter(item => item.action.command_name == command_name)
      .map(item => item.key);
    const contextMenuCommandNameList = contextMenuCommandList.map(item => item.command_name);
    const use_in_context_menu = Exist(contextMenuCommandNameList, command_name);
    return !use_in_context_menu
      ? keybindCommandNameList
      : keybindCommandNameList.concat(["ContextMenu"]);
  }

  function isUsingCommand(command_name: string): boolean {
    const bindingCommandList = BindingCommandList(command_name);
    if (bindingCommandList === null) { return true; }
    return (bindingCommandList.length != 0);
  }

  function BindingCommandsDiscriptionStr(binding_command_list: string[] | null): string {
    if (binding_command_list === null) { return "" }
    if (binding_command_list.length <= 3) {
      return binding_command_list.join(",");
    }

    return binding_command_list.slice(0, 2).join(",") + ",..."
      + "(Total " + binding_command_list.length + " binds)"
  }


  const [editDlg, Editor] = KeyBindEditor(
    (props.height - dlgHeightMagin),
    (editedSetting: ShellCommand,) => {
      let newSettings = Array.from(shellCommandsSettings);
      if (IsValidIndex(newSettings, editingIndex)) {
        newSettings[editingIndex] = editedSetting;
      }
      else {
        newSettings.push(editedSetting);
      }
      setShellCommandsSettings(newSettings);
    });
  const EditSetting = (trgIdx: number) => {
    setEditingIndex(trgIdx)
    const keyBindSetting = shellCommandsSettings[trgIdx];
    Editor(
      {
        enableRename: false,
        isValidName: () => true
      },
      keyBindSetting
    );
  }

  const buttonStyle = ButtonStyle();

  const button = () => {
    return <div
      css={css({
        marginLeft: 'auto',
        marginRight: 'auto',
      })}
    >
      <Button
        css={css(buttonStyle, { textTransform: 'none', })}
        onClick={() => {
          writSettings();
          dlg.current?.close();
          props.onOK();
        }}
      >
        Ok
      </Button>
      <Button
        css={css(buttonStyle, { textTransform: 'none', })}
        onClick={() => {
          dlg.current?.close();
        }}
      >
        Cancle
      </Button>
    </div >
  }


  const table_border = css({
    border: '1pt solid #000000',
  });

  function AddCommand(): void {
    setEditingIndex(shellCommandsSettings.length)

    const newSetting = {
      command_name: '',
      dialog_type: DIALOG_TYPE.none,
      script_path: '',
    };
    Editor(
      {
        enableRename: true,
        isValidName: (name: string) => !isUsingCommand(name),
      },
      newSetting)
  }

  const dialogElement = <dialog
    css={css({
      background: theme.backgroundColor,
      color: theme.stringDefaultColor,
      height: props.height,
      width: '95%',
    })}
    ref={dlg}
  >
    {editDlg}
    <div
      css={css({
        height: props.height,
        display: 'grid',
        placeItems: 'center',
      })}
    >
      <div>
        <button
          css={buttonStyle}
          onClick={AddCommand}
        >+</button>
        <div
          css={css({
            height: (props.height - buttonHeight), // 固定部分の高さの指定方法が良くない…。
            overflow: 'scroll',
          })}
        >
          <table>
            <thead css={[]} >
              <tr>
                <th css={[table_border]}>Command Name</th>
                <th css={[table_border]}>Binding</th>
                <th css={[table_border]}></th>
                <th css={[table_border]}></th>
              </tr>
            </thead>
            {
              shellCommandsSettings
                .map((setting, orgIdx) => { return { setting, orgIdx }; })
                .map((item, filterdIdx) => {
                  return <tbody key={'keyBindSetting' + filterdIdx}>
                    <tr
                      css={[]}
                      key={'keyBindSetting' + filterdIdx}
                    >
                      <td css={[table_border]}>{item.setting.command_name}</td>
                      <td css={[table_border]}>{BindingCommandsDiscriptionStr(BindingCommandList(item.setting.command_name))}</td>
                      <td css={[table_border]}>
                        <Button
                          css={buttonStyle}
                          disabled={isUsingCommand(item.setting.command_name)}
                          onClick={() => RemoveSetting(item.orgIdx)}
                        >x</Button>
                      </td>
                      <td css={[table_border]}>
                        <Button
                          css={css(buttonStyle, { textTransform: 'none', })}
                          onClick={() => EditSetting(item.orgIdx)}
                        >Edit</Button>
                      </td>
                    </tr>
                  </tbody>
                })
            }
          </table >
        </div>
      </div>
      {button()}
    </div>
  </dialog>

  const EditStart = () => {
    (async () => {
      setShellCommandsSettings(await readShellCommandSetting());
    })();
    dlg.current?.showModal();
  }

  return [dialogElement, EditStart];
}



///////////////////////////////////////////////////////////////////////////////////////////////////
function IsValidFileName(fileName: string): boolean {
  if (fileName === '') { return false; }
  // 記号のチェックとかも欲しい…。
  return true;
}

async function ExistFile(spcirptFilePath: string): Promise<boolean> {
  const file_content = await invoke<string | null>(
    "read_setting_file",
    {
      fileName: spcirptFilePath,
    })
    .catch(() => null);
  return (file_content !== null);
}

function CreateFile(spcirptFilePath: string) {
  invoke(
    "write_setting_file",
    {
      fileName: spcirptFilePath,
      content: shellCommandTemplate,
    });
}

interface NameCondition {
  enableRename: boolean,
  isValidName: (name: string) => boolean,
};

export function KeyBindEditor(
  height: number,
  onOk: (editedSetting: ShellCommand) => void,
): [
    JSX.Element,
    (nameCondition: NameCondition, srcCommandInfo: ShellCommand) => void,
  ] {
  const [commandName, setCommandName] = useState('');
  const [nameCondition, setNameCondition] = useState<NameCondition | null>(null);

  const [dialogType, setDialogType] = useState<DialogType>('none');

  const [spriptFileDir, setScriptFileDir] = useState('');
  useEffect(() => {
    (async () => {
      const settingDir = await invoke<string>("setting_dir", {}).catch(_ => null);
      setScriptFileDir(settingDir + '\\' + scriptDirPath + spriptFileName);
    })();
  }, []);

  const [spriptFileName, setScriptFileName] = useState('');
  const [disableCreateFile, setDisableCreateFile] = useState(false);
  useEffect(() => { updateDisableCreateFile(); }, [spriptFileDir, spriptFileName]);
  useInterval(updateDisableCreateFile, 1500);

  const [syncNames, setSyncNames] = useState(true);
  useEffect(() => {
    if (syncNames) { setScriptFileName(toScriptFileName(commandName)); }
  }, [commandName, syncNames]);

  const dlg: React.MutableRefObject<HTMLDialogElement | null> = useRef(null);

  const theme = useTheme();

  const dialogTypeComboLabel = (type: DialogType) => {
    switch (type) {
      case "none": return "none";
      case "multi_line": return "multi_line";
      case "reference_selection": return "reference_selection";
    }
  }
  const dialogTypeToComboItem = (type: DialogType) => {
    return { value: type, label: dialogTypeComboLabel(type) };
  }

  const getScriptFilePath = () => (spriptFileDir + spriptFileName);

  async function updateDisableCreateFile() {
    const IsEnableCreateFileButton = async () => {
      if (!IsValidFileName(spriptFileName)) { return false; }
      if (await ExistFile(getScriptFilePath())) { return false; }
      return true;
    }
    const isEnable = await IsEnableCreateFileButton();
    setDisableCreateFile(!isEnable);
  }

  const toScriptFileName = (command_name: string) => {
    if (command_name === "") { return "" }
    return command_name + ".ps1";
  }

  const isOkEnable = () => {
    if (commandName === "") { return false; }
    if (!nameCondition?.isValidName(commandName)) { return false; }
    return true;
  };

  const button = () => {
    return <div
      css={css({
        marginLeft: 'auto',
        marginRight: 'auto',
      })}
    >
      <Button
        css={css(ButtonStyle(), { textTransform: 'none', })}
        disabled={!isOkEnable()}
        onClick={() => {
          const shell_command = {
            command_name: commandName,
            script_path: spriptFileName,
            dialog_type: dialogType,
          };
          onOk(shell_command);
          dlg.current?.close()
        }}
      >
        Ok
      </Button>
      <Button
        css={css(ButtonStyle(), { textTransform: 'none', })}
        onClick={() => { dlg.current?.close() }}
      >
        Cancle
      </Button>
    </div >
  }

  const dialogElement = <dialog
    css={css({
      background: theme.backgroundColor,
      color: theme.stringDefaultColor,
      height: height,
      width: '60%', // 適当…。
    })}
    ref={dlg}>
    <div
      css={css({
        height: (height - buttonHeight),
        overflow: 'scroll',
      })}
    >
      <div>
        <div>Name</div>
        <input
          style={TextInputStyle()}
          type="text"
          value={commandName}
          onChange={e => { setCommandName(e.target.value) }}
          readOnly={!nameCondition?.enableRename}
        />
      </div>
      <div>
        <label>Dialog</label>
        <Select
          styles={ComboBoxStyle()}
          options={Object.values(DIALOG_TYPE).map(dialogTypeToComboItem)}
          value={dialogTypeToComboItem(dialogType)}
          onChange={(val) => {
            if (val === null) { return; }
            setDialogType(val.value)
          }}
        />
      </div>
      <div>
        <div>Script File Name</div>
        <label>
          <input
            type='checkbox'
            checked={syncNames}
            onChange={(e) => setSyncNames(!syncNames)}
          />
          Sync command name
        </label>
        <div css={css({
          display: 'flex',
          marginBottom: '20px',
        })}>
          <input
            style={TextInputStyle()}
            type="text"
            value={spriptFileName}
            onChange={e => { setScriptFileName(e.target.value) }}
            readOnly={syncNames}
          />
          <Button
            css={css(ButtonStyle(), { textTransform: 'none', })}
            onClick={() => CreateFile(getScriptFilePath())}
            disabled={disableCreateFile}
          >
            Create file</Button>
          <Button
            css={css(ButtonStyle(), { textTransform: 'none', })}
            disabled={spriptFileDir === ''}
            onClick={() => navigator.clipboard.writeText(getScriptFilePath())}
          >
            Copy file path</Button>
        </div>
      </div>
    </div>
    <div
      css={css({
        marginLeft: 'auto',
        marginRight: 'auto',
        height: buttonHeight,
      })}
    >
      {button()}
    </div>
  </dialog>

  const EditStart = (
    name_condition: NameCondition,
    shellCommand: ShellCommand
  ) => {
    setNameCondition(name_condition);

    setCommandName(shellCommand.command_name);
    setScriptFileName(shellCommand.script_path);
    setDialogType(shellCommand.dialog_type);
    const syncing = (toScriptFileName(shellCommand.command_name) === shellCommand.script_path);
    setSyncNames(syncing);
    dlg.current?.showModal();
  }

  return [dialogElement, EditStart];
}

