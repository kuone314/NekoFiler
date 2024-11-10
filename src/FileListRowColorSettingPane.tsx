import { useEffect, useState } from 'react';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import { Button } from '@mui/material';
import Select from 'react-select'
import { IsValidIndex, LastIndex } from './Utility';
import { FileListRowColorSettings, RowColorSetting, readFileListRowColorSetting, writeFileListRowColorSetting } from './FileNameColorSetting';
import { MatchingType } from './Matcher';
import { ColorCodeString } from './ColorCodeString';
import { ButtonStyle, ComboBoxStyle, TextInputStyle } from './ThemeStyle';
import { ColorSelector } from './ColorSelector';


///////////////////////////////////////////////////////////////////////////////////////////////////
type SettingsIndex = number;
type SettingTarget = 'DefaultColor' | 'SelectingColor' | SettingsIndex;

///////////////////////////////////////////////////////////////////////////////////////////////////
export function FileListRowColorSettingPane(
  props: {
    height: number
    finishSetting: () => void
  }
) {
  const [settings, setSettings] = useState<FileListRowColorSettings>();
  useEffect(() => { (async () => { setSettings(await readFileListRowColorSetting()); })() }, []);

  const [settingTarget, setSettingTarget] = useState<SettingTarget>('DefaultColor');

  const buttonStyle = ButtonStyle();
  const textInputStyle = TextInputStyle();
  const comboBoxStyle = ComboBoxStyle();

  const buttonHeight = 70;
  const heightMergin = 20; // これがないと、スクロールバーが出てしまう…
  const mainHeight = (props.height - buttonHeight - heightMergin);

  const AddSetting = () => {
    if (!settings) { return; }

    const newValue = {
      name: 'new setting',
      color: {
        oddRowBackGroune: '',
        evenRowBackGroune: '',
        forGround: '',
        activeHightlight: '',
      },
      matcher: {
        isDirectory: false,
        nameMatcher: {
          type: MatchingType.end_with,
          string: '.txt',
        },
      },
    }
    const newSetting = structuredClone(settings);
    newSetting.settings.push(newValue);
    setSettings(newSetting);
    setSettingTarget(LastIndex(newSetting.settings));
  }


  function Swap(
    trgIdx1: number,
    trgIdx2: number
  ): boolean {
    if (!settings) { return false; }
    if (!IsValidIndex(settings.settings, trgIdx1)) { return false; }
    if (!IsValidIndex(settings.settings, trgIdx2)) { return false; }

    const newSetting = structuredClone(settings);;
    [newSetting.settings[trgIdx1], newSetting.settings[trgIdx2]] = [newSetting.settings[trgIdx2], newSetting.settings[trgIdx1]]
    setSettings(newSetting)
    return true;
  }

  function MoveUp(trgIdx: number): void {
    if (!Swap(trgIdx, trgIdx - 1)) { return; }
    setSettingTarget(trgIdx - 1);
  }
  function MoveDown(trgIdx: number): void {
    if (!Swap(trgIdx, trgIdx + 1)) { return; }
    setSettingTarget(trgIdx + 1);
  }

  function DeleteSetting(trgIdx: number): void {
    if (!settings) { return; }

    const newSetting = structuredClone(settings);;
    newSetting.settings.splice(trgIdx, 1);
    setSettings(newSetting)

    if (trgIdx >= newSetting.settings.length) {
      setSettingTarget(newSetting.settings.length - 1);
    }
  }

  const Impl = () => {
    if (settingTarget === 'DefaultColor') {
      return DefaultColorSettingImpl();
    }
    if (settingTarget === 'SelectingColor') {
      return SelectingColorSettingImpl();
    }
    if (typeof (settingTarget) === 'number') {
      return SettingsImpl(settingTarget);
    }
  }

  const DefaultColorSettingImpl = () => {
    if (!settings) { return; }
    return ColorSettingImpl(
      settings.defaultColor,
      (val) => {
        const newSetting = structuredClone(settings);;
        newSetting.defaultColor = val;
        setSettings(newSetting)
      }
    );
  }
  const SelectingColorSettingImpl = () => {
    if (!settings) { return; }
    return ColorSettingImpl(
      settings.selectionColor,
      (val) => {
        const newSetting = structuredClone(settings);;
        newSetting.selectionColor = val;
        setSettings(newSetting)
      }
    );
  }
  const ColorSettingImpl = (
    src: RowColorSetting,
    onEdit: (val: RowColorSetting) => void,
  ) => {
    const setting = structuredClone(src);
    return <div
      css={css({
        display: 'flex',
        flexDirection: 'column',
        height: mainHeight,
      })}
    >

      <ColorSelector
        title={"BackGroundColor1"}
        value={setting.oddRowBackGroune}
        setValue={function (value: string): void {
          const newSetting = structuredClone(setting);
          newSetting.oddRowBackGroune = value;
          onEdit(newSetting);
        }} />
      <ColorSelector
        title={"BackGroundColor2"}
        value={setting.evenRowBackGroune}
        setValue={function (value: string): void {
          const newSetting = structuredClone(setting);
          newSetting.evenRowBackGroune = value;
          onEdit(newSetting)
        }} />
      <ColorSelector
        title={"StringColor"}
        value={setting.forGround}
        setValue={function (value: string): void {
          const newSetting = structuredClone(setting);
          newSetting.forGround = value;
          onEdit(newSetting)
        }} />
      <ColorSelector
        title={"FrameHighlightColor"}
        value={setting.activeHightlight}
        setValue={function (value: string): void {
          const newSetting = structuredClone(setting);
          newSetting.activeHightlight = value;
          onEdit(newSetting)
        }} />
    </div>

  }

  const SettingsImpl = (trgIdx: number) => {
    if (!settings) { return; }
    const setting = settings.settings[trgIdx];

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
          type="text"
          value={setting.name}
          onChange={e => {
            const newSetting = structuredClone(settings);
            newSetting.settings[trgIdx].name = e.target.value;
            setSettings(newSetting)
          }}
        />
      </label>
      <ColorSelector
        title={"BackGroundColor1"}
        value={setting.color.oddRowBackGroune}
        setValue={function (value: string): void {
          const newSetting = structuredClone(settings);
          newSetting.settings[trgIdx].color.oddRowBackGroune = value;
          setSettings(newSetting)
        }} />
      <ColorSelector
        title={"BackGroundColor2"}
        value={setting.color.evenRowBackGroune}
        setValue={function (value: string): void {
          const newSetting = structuredClone(settings);
          newSetting.settings[trgIdx].color.evenRowBackGroune = value;
          setSettings(newSetting)
        }} />
      <ColorSelector
        title={"StringColor"}
        value={setting.color.forGround}
        setValue={function (value: string): void {
          const newSetting = structuredClone(settings);
          newSetting.settings[trgIdx].color.forGround = value;
          setSettings(newSetting)
        }} />
      <ColorSelector
        title={"FrameHighlightColor"}
        value={setting.color.activeHightlight}
        setValue={function (value: string): void {
          const newSetting = structuredClone(settings);
          newSetting.settings[trgIdx].color.activeHightlight = value;
          setSettings(newSetting)
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

        <label>
          IdDirectry
        </label>

        <Select
          styles={comboBoxStyle}
          options={Object.values(MatchingType).map(toComboItem)}
          value={toComboItem(setting.matcher.nameMatcher.type)}
          onChange={(val) => {
            if (val === null) { return; }
            const newSetting = structuredClone(settings);
            newSetting.settings[trgIdx].matcher.nameMatcher.type = val.value;
            setSettings(newSetting)
          }}
        />
        <input
          style={textInputStyle}
          css={css({
            width: '100%',
          })}
          type="text"
          value={setting.matcher.nameMatcher.string}
          onChange={e => {
            const newSetting = structuredClone(settings);
            newSetting.settings[trgIdx].matcher.nameMatcher.string = e.target.value;
            setSettings(newSetting)
          }}
        />
      </div>
      <div>
        <button
          css={buttonStyle}
          onClick={() => MoveUp(trgIdx)}
        >
          ↑
        </button>
        <button
          css={buttonStyle}
          onClick={() => MoveDown(trgIdx)}
        >
          ↓
        </button>
        <button
          css={buttonStyle}
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
            css={buttonStyle}
            onClick={() => AddSetting()}
          >
            +
          </button>
          <Button
            css={buttonStyle}
            style={{
              textTransform: 'none',
              border: (settingTarget === 'DefaultColor') ? '5px solid ' + settings?.defaultColor.activeHightlight : '',
              background: `linear-gradient(to bottom, ${settings?.defaultColor.oddRowBackGroune} 50%, ${settings?.defaultColor.evenRowBackGroune} 50%)`,
              color: settings?.defaultColor.forGround,
            }}
            onClick={() => { setSettingTarget('DefaultColor') }}
          >
            Default</Button>
          <Button
            css={buttonStyle}
            style={{
              textTransform: 'none',
              border: (settingTarget === 'SelectingColor') ? '5px solid ' + settings?.selectionColor.activeHightlight : '',
              background: `linear-gradient(to bottom, ${settings?.selectionColor.oddRowBackGroune} 50%, ${settings?.selectionColor.evenRowBackGroune} 50%)`,
              color: settings?.selectionColor.forGround,
            }}
            onClick={() => { setSettingTarget('SelectingColor') }}
          >
            Selecting</Button>
          {
            settings?.settings.map((setting, idx) => {
              const evenRowBackGroune
                = ColorCodeString.new(setting.color.evenRowBackGroune)?.val
                ?? settings.defaultColor.evenRowBackGroune;
              const oddRowBackGroune
                = ColorCodeString.new(setting.color.oddRowBackGroune)?.val
                ?? settings.defaultColor.oddRowBackGroune;
              const forGround
                = ColorCodeString.new(setting.color.forGround)?.val
                ?? settings.defaultColor.forGround;
              const activeHightlight
                = ColorCodeString.new(setting.color.activeHightlight)?.val
                ?? settings.defaultColor.activeHightlight;
              return <Button
                style={{
                  textTransform: 'none',
                  background: `linear-gradient(to bottom, ${oddRowBackGroune} 50%, ${evenRowBackGroune} 50%)`,
                  border: (idx === settingTarget) ? '5px solid ' + activeHightlight : '',
                  color: forGround,
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
          css={buttonStyle}
          onClick={() => {
            writeFileListRowColorSetting(settings!);
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
