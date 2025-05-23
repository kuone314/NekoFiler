import { useState } from 'react';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import { Match, TabColorSettings, } from './TabColorSetting';
import { MatchingType } from "./Matcher";
import { Button } from '@mui/material';
import Select from 'react-select'
import { DirName } from './Utility';
import { ButtonStyle, ComboBoxStyle, TextInputStyle, useTheme } from './ThemeStyle';
import { ColorCodeString } from './ColorCodeString';
import { ColorSelector } from './ColorSelector';

///////////////////////////////////////////////////////////////////////////////////////////////////
type SettingsIndex = number;
type SettingTarget = 'DefaultColor' | SettingsIndex;

///////////////////////////////////////////////////////////////////////////////////////////////////
export function TabColorSettingPane(
  props: {
    height: number
    trgDir: string
    tabColorSetting?: TabColorSettings
    setTabColorSetting: (newValue: TabColorSettings) => void
    finishSetting: () => void
  }
) {
  const [tabColorSetting, setTabColorSetting] = useState(props.tabColorSetting);

  const initTab = () => {
    const fondIdx = tabColorSetting?.settings.findIndex(setting => Match(setting, props.trgDir)) ?? -1;
    return (fondIdx === -1) ? 'DefaultColor' : fondIdx;
  }
  const [settingTarget, setSettingTarget] = useState<SettingTarget>(initTab());

  const theme = useTheme();
  const buttonstyle = ButtonStyle(theme.baseColor);
  const textInputStyle = TextInputStyle(theme.baseColor);
  const comboBoxStyle = ComboBoxStyle(theme.baseColor);

  const buttonHeight = 70;
  const heightMergin = 20; // これがないと、スクロールバーが出てしまう…
  const mainHeight = (props.height - buttonHeight - heightMergin);

  const AddSetting = () => {
    if (!tabColorSetting) { return; }
    const newValue = {
      name: DirName(props.trgDir),
      color: {
        backGround: '',
        string: '',
        activeHightlight: '',
      },
      match: {
        type: MatchingType.start_with,
        string: props.trgDir,
      }
    }
    const newSetting = structuredClone(tabColorSetting);
    const fondIdx = tabColorSetting.settings.findIndex(setting => Match(setting, props.trgDir));
    const insertPos = (fondIdx === -1) ? newSetting.settings.length : fondIdx;
    newSetting.settings.splice(insertPos, 0, newValue)
    setTabColorSetting(newSetting)
    setSettingTarget(insertPos);
  }


  function MoveUp(trgIdx: number): void {
    if (!tabColorSetting) { return; }
    if (trgIdx == 0) { return }

    const newSetting = structuredClone(tabColorSetting);;
    [newSetting.settings[trgIdx], newSetting.settings[trgIdx - 1]] = [newSetting.settings[trgIdx - 1], newSetting.settings[trgIdx]]
    setTabColorSetting(newSetting)
    setSettingTarget(trgIdx - 1);
  }
  function MoveDown(trgIdx: number): void {
    if (!tabColorSetting) { return; }
    if (trgIdx == tabColorSetting.settings.length - 1) { return }

    const newSetting = structuredClone(tabColorSetting);;
    [newSetting.settings[trgIdx], newSetting.settings[trgIdx + 1]] = [newSetting.settings[trgIdx + 1], newSetting.settings[trgIdx]]
    setTabColorSetting(newSetting)
    setSettingTarget(trgIdx + 1);
  }

  function DeleteSetting(trgIdx: number): void {
    if (!tabColorSetting) { return; }

    const newSetting = structuredClone(tabColorSetting);;
    newSetting.settings.splice(trgIdx, 1);
    setTabColorSetting(newSetting)

    if (trgIdx >= newSetting.settings.length) {
      setSettingTarget(newSetting.settings.length - 1);
    }
  }

  const toComboItem = (type: MatchingType) => {
    return { value: type, label: comboLabel(type) };
  }
  const comboLabel = (type: MatchingType) => {
    switch (type) {
      case 'regexp': return 'Regexp';
      case 'start_with': return 'Start with';
      case 'end_with': return 'End with';
    }
  }

  const Impl = () => {
    if (settingTarget === 'DefaultColor') {
      return DefaultColorSettingImpl();
    }
    if (typeof (settingTarget) === 'number') {
      return SettingsImpl(settingTarget);
    }
  }

  const DefaultColorSettingImpl = () => {
    if (!tabColorSetting) { return <></>; }

    const setting = tabColorSetting.default;

    return <div
      css={css({
        display: 'flex',
        flexDirection: 'column',
        height: mainHeight,
      })}
    >
      <ColorSelector
        title={"BackGroundColor"}
        value={setting.backGround}
        setValue={function (value: string): void {
          const newSetting = structuredClone(tabColorSetting);
          newSetting.default.backGround = value;
          setTabColorSetting(newSetting)
        }} />
      <ColorSelector
        title={"StringColor"}
        value={setting.string}
        setValue={function (value: string): void {
          const newSetting = structuredClone(tabColorSetting);
          newSetting.default.string = value;
          setTabColorSetting(newSetting)
        }} />
      <ColorSelector
        title={"FrameHighlightColor"}
        value={setting.activeHightlight}
        setValue={function (value: string): void {
          const newSetting = structuredClone(tabColorSetting);
          newSetting.default.activeHightlight = value;
          setTabColorSetting(newSetting)
        }} />
      <div
        css={css({
          display: 'flex',
          flexDirection: 'row',
        })}
      >
      </div>
    </div>
  }

  const SettingsImpl = (trgIdx: number) => {
    if (!tabColorSetting) { return <></>; }

    const setting = tabColorSetting.settings[trgIdx];

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
            const newSetting = structuredClone(tabColorSetting);
            newSetting.settings[trgIdx].name = e.target.value;
            setTabColorSetting(newSetting)
          }}
        />
      </label>
      <ColorSelector
        title={"BackGroundColor"}
        value={setting.color.backGround}
        setValue={function (value: string): void {
          const newSetting = structuredClone(tabColorSetting);
          newSetting.settings[trgIdx].color.backGround = value;
          setTabColorSetting(newSetting)
        }} />
      <ColorSelector
        title={"StringColor"}
        value={setting.color.string}
        setValue={function (value: string): void {
          const newSetting = structuredClone(tabColorSetting);
          newSetting.settings[trgIdx].color.string = value;
          setTabColorSetting(newSetting)
        }} />
      <ColorSelector
        title={"FrameHighlightColor"}
        value={setting.color.activeHightlight}
        setValue={function (value: string): void {
          const newSetting = structuredClone(tabColorSetting);
          newSetting.settings[trgIdx].color.activeHightlight = value;
          setTabColorSetting(newSetting)
        }} />
      <div
        css={css({
          display: 'flex',
          flexDirection: 'row',
        })}
      >
        <label>
          Match
        </label>
        <Select
          styles={comboBoxStyle}
          options={Object.values(MatchingType).map(toComboItem)}
          value={toComboItem(setting.match.type)}
          onChange={(val) => {
            if (val === null) { return; }
            const newSetting = structuredClone(tabColorSetting);
            newSetting.settings[trgIdx].match.type = val.value;
            setTabColorSetting(newSetting)
          }}
        />
        <input
          css={css(
            textInputStyle,
            { width: '100%', })}
          type="text"
          value={tabColorSetting.settings[trgIdx].match.string}
          onChange={e => {
            const newSetting = structuredClone(tabColorSetting);
            newSetting.settings[trgIdx].match.string = e.target.value;
            setTabColorSetting(newSetting)
          }}
        />
      </div>
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
          <Button
            css={buttonstyle}
            style={{
              textTransform: 'none',
              border: (settingTarget === 'DefaultColor') ? '5px solid ' + tabColorSetting?.default.activeHightlight : '',
              background: tabColorSetting?.default.backGround,
              color: tabColorSetting?.default.string,
            }}
            onClick={() => { setSettingTarget('DefaultColor') }}
          >
            Default</Button>
          {
            tabColorSetting?.settings.map((setting, idx) => {
              const color = setting.color;
              const backGround = ColorCodeString.new(color.backGround)?.val
                ?? tabColorSetting.default.backGround;
              const string = ColorCodeString.new(color.string)?.val
                ?? tabColorSetting.default.string;
              const activeHightlight = ColorCodeString.new(color.activeHightlight)?.val
                ?? tabColorSetting.default.activeHightlight;

              return <Button
                style={{
                  textTransform: 'none',
                  border: (idx === settingTarget) ? '5px solid ' + activeHightlight : '',
                  background: backGround,
                  color: string,
                }}
                onClick={() => { setSettingTarget(idx) }}
                key={'Setting' + idx}
              >
                {setting.name}
              </Button>
            })
          }
        </div>
        <div>
          {Impl()}
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
            if (!tabColorSetting) { return; }
            props.setTabColorSetting(tabColorSetting)
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
