
import { useState } from 'react';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import { Match, TabNameSettings, } from './TabNameSetting';
import { DirName, IsValidIndex } from './Utility';
import { ButtonStyle, TextInputStyle, useTheme } from './ThemeStyle';
import { ApplySeparator } from './FilePathSeparator';


///////////////////////////////////////////////////////////////////////////////////////////////////

export function TabNameSettingPane(
  props: {
    height: number
    focusColor: string
    trgDir: string
    tabNameSetting?: TabNameSettings
    setTabNameSetting: (newValue: TabNameSettings) => void
    finishSetting: () => void
  }
) {
  const [tabNameSetting, setTabNameSetting] = useState(props.tabNameSetting);

  const initTab = () => {
    const fondIdx = tabNameSetting?.findIndex(setting => Match(setting, props.trgDir)) ?? -1;
    return (fondIdx === -1) ? 0 : fondIdx;
  }
  const [settingTarget, setSettingTarget] = useState<number>(initTab());

  const theme = useTheme();
  const buttonstyle = ButtonStyle(theme.baseColor);
  const textInputStyle = TextInputStyle(theme.baseColor);

  const buttonHeight = 70;
  const heightMergin = 20; // これがないと、スクロールバーが出てしまう…
  const mainHeight = (props.height - buttonHeight - heightMergin);

  const AddSetting = () => {
    if (!tabNameSetting) { return; }
    const trgDirName = DirName(props.trgDir);
    const newValue = {
      name: trgDirName,
      regexpFrom: ApplySeparator(props.trgDir, '/') + '([^/]+/)*?((?<dirName>[^/]+)/)?$',
      regexpTo: trgDirName + ':$<dirName>',
    }
    const newSetting = structuredClone(tabNameSetting);
    const fondIdx = tabNameSetting.findIndex(setting => Match(setting, props.trgDir));
    const insertPos = (fondIdx === -1) ? newSetting.length : fondIdx;
    newSetting.splice(insertPos, 0, newValue)
    setTabNameSetting(newSetting)
    setSettingTarget(insertPos);
  }


  function MoveUp(trgIdx: number): void {
    if (!tabNameSetting) { return; }
    if (trgIdx == 0) { return }

    const newSetting = structuredClone(tabNameSetting);;
    [newSetting[trgIdx], newSetting[trgIdx - 1]] = [newSetting[trgIdx - 1], newSetting[trgIdx]]
    setTabNameSetting(newSetting)
    setSettingTarget(trgIdx - 1);
  }
  function MoveDown(trgIdx: number): void {
    if (!tabNameSetting) { return; }
    if (trgIdx == tabNameSetting.length - 1) { return }

    const newSetting = structuredClone(tabNameSetting);;
    [newSetting[trgIdx], newSetting[trgIdx + 1]] = [newSetting[trgIdx + 1], newSetting[trgIdx]]
    setTabNameSetting(newSetting)
    setSettingTarget(trgIdx + 1);
  }

  function DeleteSetting(trgIdx: number): void {
    if (!tabNameSetting) { return; }

    const newSetting = structuredClone(tabNameSetting);;
    newSetting.splice(trgIdx, 1);
    setTabNameSetting(newSetting)

    if (trgIdx >= newSetting.length) {
      setSettingTarget(newSetting.length - 1);
    }
  }

  const SettingsImpl = (trgIdx: number) => {
    if (!tabNameSetting) { return <></>; }
    if (!IsValidIndex(tabNameSetting, trgIdx)) { return <></>; }

    const setting = tabNameSetting[trgIdx];

    return <div
      css={css({
        display: 'flex',
        flexDirection: 'column',
        height: mainHeight,
      })}
    >
      <label>
        Name
        <input
          style={textInputStyle}
          css={css({
            width: '100%',
          })}
          type="Name"
          value={setting.name}
          onChange={e => {
            const newSetting = structuredClone(tabNameSetting);
            newSetting[trgIdx].name = e.target.value;
            setTabNameSetting(newSetting)
          }}
        />
      </label>

      <label>
        RegExp
        <div
          css={css({
            display: 'flex',
            flexDirection: 'row',
          })}>
          <div css={css({ width: '35pt' })}>
            <label>From</label>
          </div>
          <input
            style={textInputStyle}
            css={css({
              width: '100%',
            })}
            type="Name"
            value={setting.regexpFrom}
            onChange={e => {
              const newSetting = structuredClone(tabNameSetting);
              newSetting[trgIdx].regexpFrom = e.target.value;
              setTabNameSetting(newSetting)
            }}
          />
        </div>
        <div
          css={css({
            display: 'flex',
            flexDirection: 'row',
          })}>
          <div css={css({ width: '35pt' })}>
            <label>To</label>
          </div>
          <input
            style={textInputStyle}
            css={css({
              width: '100%',
            })}
            type="Name"
            value={setting.regexpTo}
            onChange={e => {
              const newSetting = structuredClone(tabNameSetting);
              newSetting[trgIdx].regexpTo = e.target.value;
              setTabNameSetting(newSetting)
            }}
          />
        </div>
      </label>
      <div>
        <button
          css={buttonstyle}
          onClick={() => MoveUp(trgIdx)}
        >
          ↑
        </button>
        <button
          css={buttonstyle}
          onClick={() => MoveDown(trgIdx)}
        >
          ↓
        </button>
        <button
          css={buttonstyle}
          onClick={() => DeleteSetting(trgIdx)}
        >
          Delete
        </button>
      </div>
    </div>
  }

  return <>
    <div
      css={css({
        display: 'grid',
        gridTemplateRows: '0.9fr 0.1fr',
        width: '100%',
        height: '100%',
      })}
    >
      <div
        css={css({
          display: 'grid',
          gridTemplateColumns: '0.2fr 0.8fr',
          height: mainHeight,
        })}
      >
        <div
          css={css({
            display: 'flex',
            flexDirection: 'column',
            overflow: 'scroll',
          })}
        >
          <button
            css={buttonstyle}
            onClick={() => AddSetting()}
          >
            +
          </button>
          {
            tabNameSetting?.map((setting, idx) => {
              return <button
                css={buttonstyle}
                style={{
                  border: (settingTarget === idx) ? '5px solid ' + props.focusColor : '',
                }}
                onClick={() => { setSettingTarget(idx) }}
                key={'Setting' + idx}
              >
                {setting.name}
              </button>
            })
          }
        </div>
        <div>
          {SettingsImpl(settingTarget)}
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
          css={buttonstyle}
          onClick={() => {
            if (!tabNameSetting) { return; }
            props.setTabNameSetting(tabNameSetting)
            props.finishSetting()
          }}
        >
          OK
        </button>
        <button
          css={buttonstyle}
          onClick={() => props.finishSetting()}
        >
          Cancel
        </button>
      </div>
    </div>
  </>
}
