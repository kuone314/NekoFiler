import { useEffect, useRef, useState } from 'react';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import Select from 'react-select'
import { invoke } from '@tauri-apps/api';
import { Exist, IsValidIndex } from './Utility';
import { Button } from '@mui/material';
import { scriptDirPath, DIALOG_TYPE, DialogType, ShellCommand, writeShellCommandSetting, readShellCommandSetting } from './CommandInfo';
import { readKeyBindSetting } from './KeyBindInfo';
import useInterval from 'use-interval';
import { readContextMenuSetting } from './ContextMenu';


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

  const RemoveSetting = (trgIdx: number) => {
    let newSettings = Array.from(shellCommandsSettings);
    newSettings.splice(trgIdx, 1);
    setShellCommandsSettings(newSettings);
  }

  const [shellCommandNameList, setShellCommandNameList] = useState<string[] | null>(null);
  useEffect(() => {
    (async () => {
      const keybindCommandList = (await readKeyBindSetting())
        .filter(keybind => keybind.action.type === 'power_shell')
        .map(keybind => keybind.action.command_name);
      const contextMenuCommandList = (await readContextMenuSetting()).map(contextMenu => contextMenu.command_name);

      setShellCommandNameList(keybindCommandList.concat(contextMenuCommandList));
    })()
  }, []);
  function isUsingCommand(command_name: string): boolean {
    if (shellCommandNameList === null) { return true; }
    return Exist(shellCommandNameList, command_name);
  }


  const [editingIndex, setEditingIndex] = useState(0);
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
    if (shellCommandNameList === null) { return; }
    setEditingIndex(trgIdx)
    const keyBindSetting = shellCommandsSettings[trgIdx];
    Editor(
      shellCommandNameList.filter(item => item != keyBindSetting.command_name),
      keyBindSetting
    );
  }

  const button = () => {
    return <div
      css={css({
        marginLeft: 'auto',
        marginRight: 'auto',
      })}
    >
      <Button
        css={css({ textTransform: 'none', })}
        onClick={() => {
          writSettings();
          dlg.current?.close();
          props.onOK();
        }}
      >
        Ok
      </Button>
      <Button
        css={css({ textTransform: 'none', })}
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
    if (shellCommandNameList === null) { return; }
    setEditingIndex(shellCommandsSettings.length)

    const newSetting = {
      command_name: '',
      dialog_type: DIALOG_TYPE.none,
      script_path: '',
    };
    Editor(shellCommandNameList, newSetting)
  }

  const dialogElement = <dialog
    css={css({
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
                      <td css={[table_border]}>
                        <Button
                          disabled={isUsingCommand(item.setting.command_name)}
                          onClick={() => RemoveSetting(item.orgIdx)}
                        >x</Button>
                      </td>
                      <td css={[table_border]}>
                        <Button
                          css={css({ textTransform: 'none', })}
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
      filename: spcirptFilePath,
    })
    .catch(() => null);
  return (file_content !== null);
}

function CreateFile(spcirptFilePath: string) {
  invoke(
    "write_setting_file",
    {
      filename: spcirptFilePath,
      content: '',
    });
}

export function KeyBindEditor(
  height: number,
  onOk: (editedSetting: ShellCommand) => void,
): [
    JSX.Element,
    (otherCommandNameList: string[], srcCommandInfo: ShellCommand) => void,
  ] {
  const [commandName, setCommandName] = useState('');
  const [otherCommandNameList, setOtherCommandNameList] = useState<string[]>([]);

  const [dialogType, setDialogType] = useState<DialogType>('none');
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

  const [spriptFileDir, setScriptFileDir] = useState('');
  useEffect(() => {
    (async () => {
      const settingDir = await invoke<string>("setting_dir", {}).catch(_ => null);
      setScriptFileDir(settingDir + '\\' + scriptDirPath + spriptFileName);
    })();
  }, []);
  const getScriptFilePath = () => (spriptFileDir + spriptFileName);

  const [spriptFileName, setScriptFileName] = useState('');
  const [disableCreateFile, setDisableCreateFile] = useState(false);
  const updateDisableCreateFile = async () => {
    const IsEnableCreateFileButton = async () => {
      if (!IsValidFileName(spriptFileName)) { return false; }
      if (await ExistFile(getScriptFilePath())) { return false; }
      return true;
    }
    const isEnable = await IsEnableCreateFileButton();
    setDisableCreateFile(!isEnable);
  }
  useEffect(() => { updateDisableCreateFile(); }, [spriptFileDir, spriptFileName]);
  useInterval(updateDisableCreateFile, 1500);

  const [syncNames, setSyncNames] = useState(true);
  const toScriptFileName = (command_name: string) => {
    if (command_name === "") { return "" }
    return command_name + ".ps1";
  }
  useEffect(() => {
    if (syncNames) { setScriptFileName(toScriptFileName(commandName)); }
  }, [commandName, syncNames]);


  const isOkEnable = () => {
    if (commandName === "") { return false; }
    if (Exist(otherCommandNameList, commandName)) { return false; }
    return true;
  };

  const dlg: React.MutableRefObject<HTMLDialogElement | null> = useRef(null);
  const button = () => {
    return <div
      css={css({
        marginLeft: 'auto',
        marginRight: 'auto',
      })}
    >
      <Button
        css={css({ textTransform: 'none', })}
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
        css={css({ textTransform: 'none', })}
        onClick={() => { dlg.current?.close() }}
      >
        Cancle
      </Button>
    </div >
  }

  const dialogElement = <dialog
    css={css({
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
          type="text"
          value={commandName}
          onChange={e => { setCommandName(e.target.value) }}
        />
      </div>
      <div>
        <label>Dialog</label>
        <Select
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
            type="text"
            value={spriptFileName}
            onChange={e => { setScriptFileName(e.target.value) }}
            readOnly={syncNames}
          />
          <Button
            css={css({ textTransform: 'none', })}
            onClick={() => CreateFile(getScriptFilePath())}
            disabled={disableCreateFile}
          >
            Create file</Button>
          <Button
            css={css({ textTransform: 'none', })}
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
    otherCommandNameList: string[],
    shellCommand: ShellCommand
  ) => {
    setCommandName(shellCommand.command_name);
    setScriptFileName(shellCommand.script_path);
    setDialogType(shellCommand.dialog_type);
    const syncing = (toScriptFileName(shellCommand.command_name) === shellCommand.script_path);
    setSyncNames(syncing);
    setOtherCommandNameList(otherCommandNameList);
    dlg.current?.showModal();
  }

  return [dialogElement, EditStart];
}

