import { useEffect, useRef, useState } from 'react';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import Select from 'react-select'
import { CommandInfo, DialogType, CommandType, match, readCommandsSetting, writeCommandsSetting, COMMAND_TYPE, BuildinCommandType, BUILDIN_COMMAND_TYPE, DIALOG_TYPE } from './CommandInfo';
import { invoke } from '@tauri-apps/api';


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
    props.height,
    (
      editedKeyBindItem: CommandInfo,
      editedScriptContent: string,
    ) => {
      let newSettings = Array.from(keyBindSettings);
      newSettings[editingIndex] = editedKeyBindItem;
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


  const buttonHeight = 70;

  const matchEx = (commandInfo: CommandInfo) => {
    if (!trgKey) { return true; }
    return match(trgKey, commandInfo.key);
  }

  const table_border = css({
    border: '1pt solid #000000',
  });

  function AddCommand(): void {
    const newSetting = {
      command_name: 'name',
      key: trgKeyStr,
      valid_on_addressbar: true,
      dialog_type: DIALOG_TYPE.none,
      action: {
        type: COMMAND_TYPE.power_shell,
        command: '',
      }
    };
    const newSettings = [...keyBindSettings, newSetting];
    setKeyBindSettings(newSettings);
  }

  return <>
    <div
      css={css({
        height: props.height,
      })}
    >
      {editDlg}
      <div
        css={css({
          height: (props.height - buttonHeight),
          overflow: 'scroll',
        })}
      >
        <div>
          <input
            value={trgKeyStr}
            onKeyDown={event => setTrgKey(event)}
          />
          <button
            onClick={() => setTrgKey(null)}
          >x</button>
        </div>
        <button
          onClick={AddCommand}
        >+</button>
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

  const [buildinCommandType, setBuildinCommandType] = useState<BuildinCommandType>('accessCurrentItem');
  const comboLabel = (type: BuildinCommandType) => {
    switch (type) {
      case 'accessCurrentItem': return 'accessCurrentItem';
      case 'accessParentDir': return 'accessParentDir';
      case 'moveUp': return 'moveUp';
      case 'moveUpSelect': return 'moveUpSelect';
      case 'moveDown': return 'moveDown';
      case 'moveDownSelect': return 'moveDownSelect';
      case 'moveTop': return 'moveTop';
      case 'moveTopSelect': return 'moveTopSelect';
      case 'moveBottom': return 'moveBottom';
      case 'moveBottomSelect': return 'moveBottomSelect';
      case 'selectAll': return 'selectAll';
      case 'clearSelection': return 'clearSelection';
      case 'toggleSelection': return 'toggleSelection';
      case 'selectCurrentOnly': return 'selectCurrentOnly';
      case 'addNewTab': return 'addNewTab';
      case 'removeTab': return 'removeTab';
      case 'toPrevTab': return 'toPrevTab';
      case 'toNextTab': return 'toNextTab';
      case 'focusAddoressBar': return 'focusAddoressBar';
      case 'focusOppositePane': return 'focusOppositePane';
    }
  }
  const toComboItem = (type: BuildinCommandType) => {
    return { value: type, label: comboLabel(type) };
  }


  const dlg: React.MutableRefObject<HTMLDialogElement | null> = useRef(null);
  const button = () => {
    return <div
      css={css({
        marginLeft: 'auto',
        marginRight: 'auto',
      })}
    >
      <button
        onClick={() => {
          onOk(
            {
              command_name: commandName,
              key: keyStr,
              action: {
                type: commandType,
                command: (commandType == COMMAND_TYPE.power_shell) ? commandFilePath : buildinCommandType,
              },
              valid_on_addressbar: validOnAddressbar,
              dialog_type: dialogType
            },
            scriptContent);
          dlg.current?.close()
        }}
      >
        Ok
      </button>
      <button
        onClick={() => { dlg.current?.close() }}
      >
        Cancle
      </button>
    </div>
  }

  const dialogElement = <dialog
    css={css({ height: height, })}
    ref={dlg}>
    <div
      css={css({
        display: 'grid',
        gridTemplateRows: 'auto auto auto auto',
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
          value={keyStr}
          onKeyDown={event => setKey(event)}
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
      {
        (commandType == COMMAND_TYPE.power_shell) ?
          <div>
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
          </div>
          :
          <Select
            options={Object.values(BUILDIN_COMMAND_TYPE).map(toComboItem)}
            value={toComboItem(buildinCommandType)}
            onChange={(val) => {
              if (val === null) { return; }
              setBuildinCommandType(val.value)
            }}
          />
      }

      <label>
        <input
          type='checkbox'
          checked={validOnAddressbar}
          onChange={(e) => setValidOnAddressbar(!validOnAddressbar)}
        />
        validOnAddressbar
      </label>

      <label>Dialog</label>
      <Select
        options={Object.values(DIALOG_TYPE).map(dialogTypeToComboItem)}
        value={dialogTypeToComboItem(dialogType)}
        onChange={(val) => {
          if (val === null) { return; }
          setDialogType(val.value)
        }}
      />
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
    setBuildinCommandType(is_buildin ? commandInfo.action.command as BuildinCommandType : BUILDIN_COMMAND_TYPE.accessCurrentItem);
    setValidOnAddressbar(commandInfo.valid_on_addressbar);
    setDialogType(commandInfo.dialog_type);

    if (editedScriptContent) {
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

///////////////////////////////////////////////////////////////////////////////////////////////////
const toKeyStr = (keyEvnet: React.KeyboardEvent<HTMLDivElement> | null) => {
  if (!keyEvnet) { return ''; }

  const strAry = [];
  if (keyEvnet.ctrlKey) { strAry.push('ctrl'); }
  if (keyEvnet.altKey) { strAry.push('alt'); }
  if (keyEvnet.shiftKey) { strAry.push('shift'); }

  const key = keyEvnet.key;
  if (!['Control', 'Alt', 'Shift',].find(item => item === key)) {
    const rowKeyStr = (() => {
      if (key === ' ') { return 'Space'; }
      if (key.length === 1) { return key.toUpperCase(); }
      return key;
    })();
    strAry.push(rowKeyStr);
  }
  return strAry.join('+');
}
