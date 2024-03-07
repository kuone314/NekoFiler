import { useEffect, useRef, useState } from 'react';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import Select from 'react-select'
import { CommandInfo, DialogType, CommandType, match, readCommandsSetting, writeCommandsSetting, COMMAND_TYPE, BuildinCommandType, BUILDIN_COMMAND_TYPE, DIALOG_TYPE, ToBuildinCommandType, toKeyStr } from './CommandInfo';
import { invoke } from '@tauri-apps/api';
import { IsValidIndex } from './Utility';
import { Button } from '@mui/material';


///////////////////////////////////////////////////////////////////////////////////////////////////
const buttonHeight = 70;
const dlgHeightMagin = 60;

///////////////////////////////////////////////////////////////////////////////////////////////////
export function KeyBindSettingPane(
  props: {
    height: number
    finishSetting: () => void
  }
) {
  const [trgKey, setTrgKey] = useState<React.KeyboardEvent<HTMLDivElement> | null>(null);
  const [trgKeyStr, setTrgKeyStr] = useState('');
  useEffect(() => {
    setTrgKeyStr(toKeyStr(trgKey));
  }, [trgKey]);

  const [keyBindSettings, setKeyBindSettings] = useState<CommandInfo[]>([]);
  const [editedScriptContents, setEditedScriptContents] = useState(new Map<string, string>());
  useEffect(() => { (async () => { setKeyBindSettings(await readCommandsSetting()); })() }, []);
  function writSettings() {
    writeCommandsSetting(keyBindSettings);
    editedScriptContents.forEach((content, path) => {
      invoke<String>("write_setting_file", { filename: path, content: content });
    })
  }

  const RemoveSetting = (trgIdx: number) => {
    let newSettings = Array.from(keyBindSettings);
    newSettings.splice(trgIdx, 1);
    setKeyBindSettings(newSettings);
  }

  const [editingIndex, setEditingIndex] = useState(0);
  const [editDlg, Editor] = KeyBindEditor(
    (props.height - dlgHeightMagin),
    (
      editedKeyBindItem: CommandInfo,
      editedScriptContent: string,
    ) => {
      let newSettings = Array.from(keyBindSettings);
      if (IsValidIndex(newSettings, editingIndex)) {
        newSettings[editingIndex] = editedKeyBindItem;
      }
      else {
        newSettings.push(editedKeyBindItem);
      }
      setKeyBindSettings(newSettings);

      const newEditedScriptContents = new Map(editedScriptContents);
      newEditedScriptContents.set(editedKeyBindItem.action.command, editedScriptContent)
      setEditedScriptContents(newEditedScriptContents)
    });
  const EditSetting = (trgIdx: number) => {
    setEditingIndex(trgIdx)
    const keyBindSetting = keyBindSettings[trgIdx];
    const editedContent = editedScriptContents.get(keyBindSetting.action.command) ?? null;
    Editor(keyBindSetting, editedContent)
  }

  const matchEx = (commandInfo: CommandInfo) => {
    if (!trgKey) { return true; }
    return match(trgKey, commandInfo.key);
  }

  const table_border = css({
    border: '1pt solid #000000',
  });

  function AddCommand(): void {
    setEditingIndex(keyBindSettings.length)

    const newSetting = {
      command_name: 'new command',
      key: trgKeyStr,
      valid_on_addressbar: true,
      dialog_type: DIALOG_TYPE.none,
      action: {
        type: COMMAND_TYPE.power_shell,
        command: '',
      }
    };
    Editor(newSetting, "")
  }

  return <>
    <div
      css={css({
        height: props.height,
      })}
    >
      {editDlg}
      <div>
        <input
          defaultValue={trgKeyStr}
          onKeyDown={event => { setTrgKey(event); event.preventDefault(); }}
        />
        <button
          onClick={() => setTrgKey(null)}
        >x</button>
      </div>
      <button
        onClick={AddCommand}
      >+</button>
      <div
        css={css({
          height: (props.height - buttonHeight * 2), // 固定部分の高さの指定方法が良くない…。
          overflow: 'scroll',
        })}
      >
        <table>
          <thead css={[]} >
            <tr>
              <th css={[table_border]}>Key</th>
              <th css={[table_border]}>Name</th>
              <th css={[table_border]}></th>
            </tr>
          </thead>
          {
            keyBindSettings
              .map((setting, orgIdx) => { return { setting, orgIdx }; })
              .filter(item => matchEx(item.setting))
              .map((item, filterdIdx) => {
                return <tbody key={'keyBindSetting' + filterdIdx}>
                  <tr
                    css={[]}
                    key={'keyBindSetting' + filterdIdx}
                  >
                    <td css={[table_border]}>{item.setting.key}</td>
                    <td css={[table_border]}>{item.setting.command_name}</td>
                    <td css={[table_border]}>
                      <button
                        onClick={() => RemoveSetting(item.orgIdx)}
                      >x</button>
                    </td>
                    <td css={[table_border]}>
                      <button
                        onClick={() => EditSetting(item.orgIdx)}
                      >Edit</button>
                    </td>
                  </tr>
                </tbody>
              })
          }
        </table >

      </div>

      <div
        css={css({
          marginLeft: 'auto',
          marginRight: 'auto',
          height: buttonHeight,
        })}
      >
        <button
          onClick={() => {
            writSettings()
            props.finishSetting()
          }}
        >
          OK
        </button>
        <button
          onClick={() => props.finishSetting()}
        >
          Cancel
        </button>
      </div>

    </div>
  </>
}


///////////////////////////////////////////////////////////////////////////////////////////////////
export function KeyBindEditor(
  height: number,
  onOk: (editedKeyBindItem: CommandInfo, editedScriptContent: string) => void,
): [
    JSX.Element,
    (srcCommandInfo: CommandInfo, editedScriptContent: string | null) => void,
  ] {
  const [commandName, setCommandName] = useState('');

  const [keyStr, setKeyStr] = useState('');
  const [key, setKey] = useState<React.KeyboardEvent<HTMLDivElement> | null>(null);
  useEffect(() => { setKeyStr(toKeyStr(key)); }, [key]);

  const [scriptContent, setScriptContent] = useState('');

  const [commandType, setCommandType] = useState<CommandType>('power_shell');

  const [commandFilePath, setCommandFilePath] = useState('');

  const [validOnAddressbar, setValidOnAddressbar] = useState(false);
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

  const [buildinCommandType, setBuildinCommandType] = useState<BuildinCommandType | null>('accessCurrentItem');
  const comboLabel = (type: BuildinCommandType) => {
    return type;
  }
  const toComboItem = (type: BuildinCommandType) => {
    return { value: type, label: comboLabel(type) };
  }

  const isOkEnable = () => {
    switch (commandType) {
      case 'build_in': return true;
      case 'power_shell': return commandFilePath !== ""; // 有効なパスかのチェックもした方が良い…。
    }
  }


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
          const command = (commandType == COMMAND_TYPE.power_shell) ? commandFilePath : buildinCommandType;
          onOk(
            {
              command_name: commandName,
              key: keyStr,
              action: {
                type: commandType,
                command: command ?? "",
              },
              valid_on_addressbar: validOnAddressbar,
              dialog_type: dialogType
            },
            scriptContent);
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
      <div
        css={css({
          display: 'grid',
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
          <div>Key</div>
          <input
            type="text"
            defaultValue={keyStr}
            onKeyDown={event => { setKey(event); event.preventDefault(); }}
          />
        </div>
        <div>
          <input
            type="radio" name='CommandType'
            checked={commandType == COMMAND_TYPE.power_shell}
            onChange={() => setCommandType(COMMAND_TYPE.power_shell)} />
          <label onClick={() => setCommandType(COMMAND_TYPE.power_shell)}>power_shell</label>
          <input
            type="radio" name='CommandType'
            checked={commandType == COMMAND_TYPE.build_in}
            onChange={() => setCommandType(COMMAND_TYPE.build_in)} />
          <label onClick={() => setCommandType(COMMAND_TYPE.build_in)}>build_in</label>
        </div>

        <label>
          <input
            type='checkbox'
            checked={validOnAddressbar}
            onChange={(e) => setValidOnAddressbar(!validOnAddressbar)}
          />
          validOnAddressbar
        </label>

        {
          (commandType == COMMAND_TYPE.power_shell) ?
            <div
              css={css({
                display: 'grid',
                gridTemplateRows: 'auto auto auto auto',
              })}
            >
              <div>
                <div>ScriptPath</div>
                <input
                  type="text"
                  value={commandFilePath}
                  onChange={e => { setCommandFilePath(e.target.value) }}
                />
              </div>
              <textarea
                value={scriptContent}
                onChange={e => {
                  setScriptContent(e.target.value);
                }}
                rows={15}
              />
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
            :
            <Select
              options={Object.values(BUILDIN_COMMAND_TYPE).map(toComboItem)}
              value={toComboItem(buildinCommandType ?? BUILDIN_COMMAND_TYPE.accessCurrentItem)}
              onChange={(val) => {
                if (val === null) { return; }
                setBuildinCommandType(val.value)
              }}
            />
        }

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
    commandInfo: CommandInfo,
    editedScriptContent: string | null
  ) => {
    const is_buildin = (commandInfo.action.type == COMMAND_TYPE.build_in);
    setCommandName(commandInfo.command_name);
    setKeyStr(commandInfo.key);
    setCommandType(commandInfo.action.type);
    setCommandFilePath(!is_buildin ? commandInfo.action.command : "");
    setBuildinCommandType(is_buildin ? ToBuildinCommandType(commandInfo.action.command) : null);
    setValidOnAddressbar(commandInfo.valid_on_addressbar);
    setDialogType(commandInfo.dialog_type);

    if (editedScriptContent !== null) {
      setScriptContent(editedScriptContent);
    } else {
      if (commandInfo.action.type === 'power_shell') {
        (async () => {
          setScriptContent(await invoke<string>("read_setting_file", { filename: commandInfo.action.command }))
        })()
      }
    }

    dlg.current?.showModal();
  }

  return [dialogElement, EditStart];
}
