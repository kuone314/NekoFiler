import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import Select from 'react-select'
import { IsValidIndex, LastIndex } from './Utility';
import { Button } from '@mui/material';
import { readShellCommandSetting } from './CommandInfo';
import { ShellCommandsSettingPane } from './ShellCommandsSettingPane';
import { ContextMenuInfo, readContextMenuSetting, writeContextMenuSetting } from './ContextMenu';
import { ButtonStyle, ComboBoxStyle, TextInputStyle, useTheme } from './ThemeStyle';


///////////////////////////////////////////////////////////////////////////////////////////////////
const buttonHeight = 70;
const dlgHeightMagin = 60;

///////////////////////////////////////////////////////////////////////////////////////////////////
export function ContextMenuSettingPane(
  props: {
    height: number
    finishSetting: () => void
  }
) {
  const [contextMenuSettings, setContextMenuSettings] = useState<ContextMenuInfo[]>([]);
  useEffect(() => { (async () => { setContextMenuSettings(await readContextMenuSetting()); })() }, []);

  const theme = useTheme();
  const buttonStyle = ButtonStyle(theme.baseColor);

  function writSettings() {
    writeContextMenuSetting(contextMenuSettings);
  }

  const RemoveSetting = (trgIdx: number) => {
    let newSettings = structuredClone(contextMenuSettings);
    newSettings.splice(trgIdx, 1);
    setContextMenuSettings(newSettings);
  }

  const [editingIndex, setEditingIndex] = useState(0);

  const editorFunc = useRef<ContextMenuInfoEditorFunc>(null);

  const EditSetting = (trgIdx: number) => {
    setEditingIndex(trgIdx)
    const contextMenuInfo = contextMenuSettings[trgIdx];
    editorFunc.current?.editStart(contextMenuInfo)
  }

  function Swap(idx_1: number, idx_2: number): void {
    if (!IsValidIndex(contextMenuSettings, idx_1)) { return; }
    if (!IsValidIndex(contextMenuSettings, idx_2)) { return; }
    let newContextMenuSettings = Array.from(contextMenuSettings);
    [newContextMenuSettings[idx_1], newContextMenuSettings[idx_2]] = [newContextMenuSettings[idx_2], newContextMenuSettings[idx_1]]
    setContextMenuSettings(newContextMenuSettings);
  }
  function MoveUp(idx: number): void {
    Swap(idx, idx - 1);
  }

  function MoveDown(idx: number): void {
    Swap(idx, idx + 1);
  }

  const table_border = css({
    border: '1pt solid ' + theme.baseColor.stringDefaultColor,
  });

  function AddSetting(): void {
    setEditingIndex(contextMenuSettings.length)

    const newSetting = {
      display_name: "",
      command_name: "",
    };
    editorFunc.current?.editStart(newSetting);
  }

  return <>
    <ContextMenuInfoEditor
      ref={editorFunc}
      height={(props.height - dlgHeightMagin)}
      onOk={(editItem: ContextMenuInfo) => {
        let newSettings = Array.from(contextMenuSettings);
        if (IsValidIndex(newSettings, editingIndex)) {
          newSettings[editingIndex] = editItem;
        }
        else {
          newSettings.push(editItem);
        }
        setContextMenuSettings(newSettings);
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
        <button
          css={buttonStyle}
          onClick={AddSetting}
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
                <th css={[table_border]}>Name</th>
                <th css={[table_border]}></th>
                <th css={[table_border]}></th>
                <th css={[table_border]}></th>
                <th css={[table_border]}></th>
              </tr>
            </thead>
            {
              contextMenuSettings
                .map((item, idx) => {
                  return <tbody key={'Setting' + idx}>
                    <tr
                      css={[]}
                      key={'Setting' + idx}
                    >
                      <td css={[table_border]}>{item.display_name}</td>
                      <td css={[table_border]}>
                        {
                          (idx !== 0)
                            ? <button
                              css={buttonStyle}
                              onClick={() => MoveUp(idx)}
                            >↑</button>
                            : <></>
                        }
                      </td>
                      <td css={[table_border]}>
                        {
                          (idx !== LastIndex(contextMenuSettings))
                            ? <button
                              css={buttonStyle}
                              onClick={() => MoveDown(idx)}
                            >↓</button>
                            : <></>
                        }
                      </td>
                      <td css={[table_border]}>
                        <button
                          css={buttonStyle}
                          onClick={() => RemoveSetting(idx)}
                        >x</button>
                      </td>
                      <td css={[table_border]}>
                        <button
                          css={buttonStyle}
                          onClick={() => EditSetting(idx)}
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

export interface ContextMenuInfoEditorFunc {
  editStart: (srcCommandInfo: ContextMenuInfo) => void
}

type ContextMenuInfoEditorProps = {
  height: number,
  onOk: (editedKeyBindItem: ContextMenuInfo) => void,
};

export const ContextMenuInfoEditor = forwardRef<ContextMenuInfoEditorFunc, ContextMenuInfoEditorProps>((props, ref) => {
  useImperativeHandle(ref, () => functions);

  const [menuName, setMenuName] = useState('');

  const [shellCommandNameList, setShellCommandNameList] = useState<string[]>([]);
  const [commandName, setCommandName] = useState<string>('');
  useEffect(() => { updateShellCommandList(); }, []);

  const theme = useTheme();
  const textInputStyle = TextInputStyle(theme.baseColor);
  const comboBoxStyle = ComboBoxStyle(theme.baseColor);
  const buttonStyle = ButtonStyle(theme.baseColor);

  const updateShellCommandList = async () => {
    const shellCommandList = await readShellCommandSetting();
    setShellCommandNameList(shellCommandList.map(command => command.command_name));
  };


  const toComboItem = (str: string) => {
    return { value: str, label: str };
  }

  const isOkEnable = () => (menuName !== "");


  const dlg: React.MutableRefObject<HTMLDialogElement | null> = useRef(null);
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
          const key_bind_setting = {
            display_name: menuName,
            command_name: commandName,
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

  const [commandSettingDialog, startCommandSetting] = ShellCommandsSettingPane({
    height: props.height,
    onOK: () => updateShellCommandList(),
  });

  const dialogElement = <dialog
    css={css({
      background: theme.baseColor.backgroundColor,
      color: theme.baseColor.stringDefaultColor,
      height: props.height,
      width: '60%', // 適当…。
    })}
    ref={dlg}>
    {commandSettingDialog}
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
            value={menuName}
            onChange={e => { setMenuName(e.target.value) }}
          />
        </div>

        <div>Command</div>
        <Select
          styles={comboBoxStyle}
          options={shellCommandNameList.map(toComboItem)}
          value={toComboItem(commandName)}
          onChange={(val) => {
            if (val === null) { return; }
            setCommandName(val.value)
          }}
        />
        <button
          css={buttonStyle}
          onClick={startCommandSetting}
        >Edit Commands</button>

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
    src: ContextMenuInfo
  ) => {
    setMenuName(src.display_name);
    setCommandName(src.command_name);
    dlg.current?.showModal();
  }


  const functions = {
    editStart: EditStart,
  };
  return dialogElement;
});
