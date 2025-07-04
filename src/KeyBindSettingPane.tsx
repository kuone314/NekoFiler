import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import Select from 'react-select'
import { IsValidIndex, LastIndex } from './Utility';
import { Button } from '@mui/material';
import { BuildinCommandType, BUILDIN_COMMAND_TYPE, ToBuildinCommandType, readShellCommandSetting } from './CommandInfo';
import { toKeyStr, KeyBindSetting, readKeyBindSetting, writeKeyBindSetting, match, COMMAND_TYPE, CommandType } from './KeyBindInfo';
import { ShellCommandsSettingPane, ShellCommandsSettingPaneFunc } from './ShellCommandsSettingPane';
import { ButtonStyle, ComboBoxStyle, TextInputStyle, useTheme } from './ThemeStyle';


///////////////////////////////////////////////////////////////////////////////////////////////////
const buttonHeight = 70;
const dlgHeightMagin = 60;

///////////////////////////////////////////////////////////////////////////////////////////////////
export function KeyBindSettingPane(
  props: {
    height: number
    keySetTrg: React.KeyboardEvent<HTMLDivElement> | null
    finishSetting: () => void
  }
) {
  const [trgKey, setTrgKey] = useState<React.KeyboardEvent<HTMLDivElement> | null>(props.keySetTrg);
  const [trgKeyStr, setTrgKeyStr] = useState('');
  useEffect(() => {
    setTrgKeyStr(toKeyStr(trgKey));
  }, [trgKey]);

  const [keyBindSettings, setKeyBindSettings] = useState<KeyBindSetting[]>([]);
  useEffect(() => { (async () => { setKeyBindSettings(await readKeyBindSetting()); })() }, []);
  function writSettings() {
    writeKeyBindSetting(keyBindSettings);
  }
  const [editingIndex, setEditingIndex] = useState(0);

  const theme = useTheme();
  const buttonStyle = ButtonStyle(theme.baseColor);
  const textInputStyle = TextInputStyle(theme.baseColor);

  const RemoveSetting = (trgIdx: number) => {
    let newSettings = Array.from(keyBindSettings);
    newSettings.splice(trgIdx, 1);
    setKeyBindSettings(newSettings);
  }

  const editorFunc = useRef<KeyBindEditorFunc>(null);

  const EditSetting = (trgIdx: number) => {
    setEditingIndex(trgIdx)
    const keyBindSetting = keyBindSettings[trgIdx];
    editorFunc.current?.editStart(keyBindSetting)
  }

  const matchEx = (commandInfo: KeyBindSetting) => {
    if (!trgKey) { return true; }
    return match(trgKey, commandInfo.key);
  }

  const filterdKeyBindSettings = keyBindSettings
    .map((setting, orgIdx) => { return { setting, orgIdx }; })
    .filter(item => matchEx(item.setting));

  function MoveUp(filterdIdx: number): void {
    const trg_idx_1 = filterdKeyBindSettings[filterdIdx].orgIdx;
    const trg_filterd_idx_2 = filterdIdx - 1;
    if (!IsValidIndex(filterdKeyBindSettings, trg_filterd_idx_2)) { return; }
    const trg_idx_2 = filterdKeyBindSettings[trg_filterd_idx_2].orgIdx;
    let newKeyBindSettings = Array.from(keyBindSettings);
    [newKeyBindSettings[trg_idx_1], newKeyBindSettings[trg_idx_2]] = [newKeyBindSettings[trg_idx_2], newKeyBindSettings[trg_idx_1]]
    setKeyBindSettings(newKeyBindSettings);
  }

  function MoveDown(filterdIdx: number): void {
    const trg_idx_1 = filterdKeyBindSettings[filterdIdx].orgIdx;
    const trg_filterd_idx_2 = filterdIdx + 1;
    if (!IsValidIndex(filterdKeyBindSettings, trg_filterd_idx_2)) { return; }
    const trg_idx_2 = filterdKeyBindSettings[trg_filterd_idx_2].orgIdx;
    let newKeyBindSettings = Array.from(keyBindSettings);
    [newKeyBindSettings[trg_idx_1], newKeyBindSettings[trg_idx_2]] = [newKeyBindSettings[trg_idx_2], newKeyBindSettings[trg_idx_1]]
    setKeyBindSettings(newKeyBindSettings);
  }

  const table_border = css({
    border: '1pt solid ' + theme.baseColor.stringDefaultColor,
  });

  function AddKeyBind(): void {
    setEditingIndex(keyBindSettings.length)

    const newSetting = {
      display_name: '',
      key: trgKeyStr,
      valid_on_addressbar: true,
      action: {
        type: COMMAND_TYPE.power_shell,
        command_name: '',
      }
    };
    editorFunc.current?.editStart(newSetting)
  }

  return <>
    <KeyBindEditor
      ref={editorFunc}
      height={(props.height - dlgHeightMagin)}
      onOk={(editedKeyBindItem: KeyBindSetting) => {
        let newSettings = Array.from(keyBindSettings);
        if (IsValidIndex(newSettings, editingIndex)) {
          newSettings[editingIndex] = editedKeyBindItem;
        }
        else {
          newSettings.push(editedKeyBindItem);
        }
        setKeyBindSettings(newSettings);
      }}
    />
    <div
      css={css({
        height: props.height,
        display: 'grid',
        placeItems: 'center',
      })}
    >
      <div>
        <div>
          <input
            style={textInputStyle}
            placeholder='Target key'
            defaultValue={trgKeyStr}
            onKeyDown={event => { setTrgKey(event); event.preventDefault(); }}
          />
          <button
            css={buttonStyle}
            onClick={() => setTrgKey(null)}
          >Clear</button>
        </div>
        <button
          css={buttonStyle}
          onClick={AddKeyBind}
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
                <th css={[table_border]}></th>
                <th css={[table_border]}></th>
                <th css={[table_border]}></th>
              </tr>
            </thead>
            {
              filterdKeyBindSettings
                .map((item, filterdIdx) => {
                  return <tbody key={'keyBindSetting' + filterdIdx}>
                    <tr
                      css={[]}
                      key={'keyBindSetting' + filterdIdx}
                    >
                      <td css={[table_border]}>{item.setting.key}</td>
                      <td css={[table_border]}>{item.setting.display_name}</td>
                      <td css={[table_border]}>
                        {
                          (filterdIdx !== 0)
                            ? <button
                              css={buttonStyle}
                              onClick={() => MoveUp(filterdIdx)}
                            >↑</button>
                            : <></>
                        }
                      </td>
                      <td css={[table_border]}>
                        {
                          (filterdIdx !== LastIndex(filterdKeyBindSettings))
                            ? <button
                              css={buttonStyle}
                              onClick={() => MoveDown(filterdIdx)}
                            >↓</button>
                            : <></>
                        }
                      </td>
                      <td css={[table_border]}>
                        <button
                          css={buttonStyle}
                          onClick={() => RemoveSetting(item.orgIdx)}
                        >x</button>
                      </td>
                      <td css={[table_border]}>
                        <button
                          css={buttonStyle}
                          onClick={() => EditSetting(item.orgIdx)}
                        >Edit</button>
                      </td>
                    </tr>
                  </tbody>
                })
            }
          </table >
        </div>
      </div>

      <div
        css={css({
          marginLeft: 'auto',
          marginRight: 'auto',
          height: buttonHeight,
        })}
      >
        <button
          css={buttonStyle}
          onClick={() => {
            writSettings()
            props.finishSetting()
          }}
        >
          OK
        </button>
        <button
          css={buttonStyle}
          onClick={() => props.finishSetting()}
        >
          Cancel
        </button>
      </div>

    </div>
  </>
}


///////////////////////////////////////////////////////////////////////////////////////////////////

export interface KeyBindEditorFunc {
  editStart: (srcCommandInfo: KeyBindSetting) => void
}

type KeyBindEditorProps = {
  height: number,
  onOk: (editedKeyBindItem: KeyBindSetting) => void,
};

export const KeyBindEditor = forwardRef<KeyBindEditorFunc, KeyBindEditorProps>((props, ref) => {
  useImperativeHandle(ref, () => functions);

  const [keyBindName, setKeyBindName] = useState('');

  const [keyStr, setKeyStr] = useState('');
  const [key, setKey] = useState<React.KeyboardEvent<HTMLDivElement> | null>(null);
  useEffect(() => { setKeyStr(toKeyStr(key)); }, [key]);

  const [validOnAddressbar, setValidOnAddressbar] = useState(false);

  const [commandType, setCommandType] = useState<CommandType>('power_shell');
  const [buildinCommandType, setBuildinCommandType] = useState<BuildinCommandType | null>('accessCurrentItem');
  const [shellCommandNameList, setShellCommandNameList] = useState<string[]>([]);
  const [shellCommandName, setShellCommandName] = useState<string>('');
  useEffect(() => { updateShellCommandList(); }, []);

  const dlg: React.MutableRefObject<HTMLDialogElement | null> = useRef(null);

  const theme = useTheme();
  const buttonStyle = ButtonStyle(theme.baseColor);
  const textInputStyle = TextInputStyle(theme.baseColor);
  const comboBoxStyle = ComboBoxStyle(theme.baseColor);

  const updateShellCommandList = async () => {
    const shellCommandList = await readShellCommandSetting();
    setShellCommandNameList(shellCommandList.map(command => command.command_name));
  };


  const toComboItem = (str: string) => {
    return { value: str, label: str };
  }

  const toBuildinCommandTypeComboItem = (type: BuildinCommandType) => {
    return { value: type, label: type };
  }

  const isOkEnable = () => (keyBindName !== "");


  const button = () => {
    return <div
      css={css({
        marginLeft: 'auto',
        marginRight: 'auto',
      })}
    >
      <Button
        css={css(buttonStyle, { textTransform: 'none', })}
        disabled={!isOkEnable()}
        onClick={() => {
          const command_name = (commandType == COMMAND_TYPE.power_shell) ? shellCommandName : buildinCommandType;
          const key_bind_setting = {
            display_name: keyBindName,
            key: keyStr,
            valid_on_addressbar: validOnAddressbar,
            action: {
              type: commandType,
              command_name: command_name ?? "",
            },
          };
          props.onOk(key_bind_setting);
          dlg.current?.close()
        }}
      >
        Ok
      </Button>
      <Button
        css={css(buttonStyle, { textTransform: 'none', })}
        onClick={() => { dlg.current?.close() }}
      >
        Cancle
      </Button>
    </div >
  }

  const shellCommandsSettingPaneFunc = useRef<ShellCommandsSettingPaneFunc>(null);

  const dialogElement = <dialog
    css={css({
      background: theme.baseColor.backgroundColor,
      color: theme.baseColor.stringDefaultColor,
      height: props.height,
      width: '60%', // 適当…。
    })}
    ref={dlg}>
    <ShellCommandsSettingPane
      ref={shellCommandsSettingPaneFunc}
      height={props.height}
      onOK={() => updateShellCommandList()}
    />
    <div
      css={css({
        height: (props.height - buttonHeight),
        overflow: 'scroll',
      })}
    >
      <div>
        <div>
          <div>Name</div>
          <input
            style={textInputStyle}
            type="text"
            value={keyBindName}
            onChange={e => { setKeyBindName(e.target.value) }}
          />
        </div>
        <div>
          <div>Key</div>
          <input
            style={textInputStyle}
            type="text"
            defaultValue={keyStr}
            onKeyDown={event => { setKey(event); event.preventDefault(); }}
          />
        </div>
        <label>
          <input
            type='checkbox'
            checked={validOnAddressbar}
            onChange={(_) => setValidOnAddressbar(!validOnAddressbar)}
          />
          Valid on addressbar
        </label>

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
            <>
              <Select
                styles={comboBoxStyle}
                options={shellCommandNameList.map(toComboItem)}
                value={toComboItem(shellCommandName)}
                onChange={(val) => {
                  if (val === null) { return; }
                  setShellCommandName(val.value)
                }}
              />
              <button
                css={buttonStyle}
                onClick={shellCommandsSettingPaneFunc.current?.editStart}
              >Edit Commands</button>
            </>
            :
            <Select
              options={Object.values(BUILDIN_COMMAND_TYPE).map(toBuildinCommandTypeComboItem)}
              value={toBuildinCommandTypeComboItem(buildinCommandType ?? BUILDIN_COMMAND_TYPE.accessCurrentItem)}
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
    commandInfo: KeyBindSetting
  ) => {
    const is_buildin = (commandInfo.action.type == COMMAND_TYPE.build_in);
    setKeyBindName(commandInfo.display_name);
    setKeyStr(commandInfo.key);
    setCommandType(commandInfo.action.type);
    setValidOnAddressbar(commandInfo.valid_on_addressbar);
    setBuildinCommandType(is_buildin ? ToBuildinCommandType(commandInfo.action.command_name) : 'accessCurrentItem');
    setShellCommandName(!is_buildin ? commandInfo.action.command_name : "");
    dlg.current?.showModal();
  }

  const functions = {
    editStart: EditStart,
  };

  return dialogElement;
});
