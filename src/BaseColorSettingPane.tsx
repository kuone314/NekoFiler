import { useEffect, useState } from 'react';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import Select from 'react-select'
import { ButtonStyle, ComboBoxStyle, TextInputStyle, useTheme } from './ThemeStyle';
import { BaseColorSetting, readBaseColor, writeBaseColor } from './BaseColorSetting';
import { ColorSelector } from './ColorSelector';


///////////////////////////////////////////////////////////////////////////////////////////////////
export function BaseColorSettingPane(
  props: {
    height: number
    finishSetting: () => void
  }
) {
  const [setting, setSetting] = useState<BaseColorSetting>();
  useEffect(() => {
    (async () => {
      setSetting(await readBaseColor());
    })()
  }, []);

  const theme = useTheme();
  const buttonStyle = ButtonStyle(theme.baseColor);

  const buttonHeight = 70;
  const heightMergin = 20; // これがないと、スクロールバーが出てしまう…
  const mainHeight = (props.height - buttonHeight - heightMergin);


  if (!setting) { return <></>; }

  return <>
    <div
      css={css({
        display: 'grid',
        gridTemplateRows: 'auto auto',
        width: '100%',
        height: '100%',
      })}
    >
      <div
        css={css({
          display: 'grid',
          gridTemplateColumns: '0.7fr 0.3fr',
        })}>
        <SettingImpl
          mainHeight={mainHeight}
          setting={setting}
          setSetting={setSetting}
        />
        <ResultSample
          setting={setting}
        />
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
            if (!setting) { return; }
            theme.setBaseColor(setting);
            writeBaseColor(setting);
            props.finishSetting();
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
    </div >
  </>
}

function ResultSample(props: {
  setting: BaseColorSetting
}) {
  return <>
    <div
      css={{
        border: '1pt solid ' + props.setting.stringDefaultColor,
        backgroundColor: props.setting.backgroundColor,
        marginLeft: 'auto',
        marginRight: 'auto',
      }}
    >
      <style>
        {`
          input::selection {
            background-color: ${props.setting.elementSelectionColor}
          }
        `}
      </style>
      <div css={css({ color: props.setting.stringDefaultColor, })}>
        Sample
      </div>
      <button
        css={ButtonStyle(props.setting)}
      > Button Sample</button>
      <button
        css={ButtonStyle(props.setting)}
        disabled
      > Disabled Button Sample</button>
      <input
        style={TextInputStyle(props.setting)}
        value={"Text Area Sample"} />
      <div
        css={css({ color: props.setting.stringErrorColor, })}
      >
        Error Strin Sample
      </div>
      <Select
        styles={ComboBoxStyle(props.setting)}
        options={[
          { value: "0", label: "Combo Box Sample" },
          { value: "1", label: "Dummy" },
          { value: "2", label: "Dummy" },
          { value: "3", label: "Dummy" },
        ]} />
    </div>
  </>;
}

function SettingImpl(
  props: {
    mainHeight: number,
    setting: BaseColorSetting,
    setSetting: (val: BaseColorSetting) => void,
  }
) {
  return <div
    css={css({
      display: 'flex',
      flexDirection: 'column',
      height: props.mainHeight,
      marginLeft: 'auto',
      marginRight: 'auto',
    })}
  >
    <ColorSelector
      title={"Background Color"}
      value={props.setting.backgroundColor}
      setValue={function (value: string): void {
        const newSetting = structuredClone(props.setting);
        newSetting.backgroundColor = value;
        props.setSetting(newSetting);
      }} />
    <ColorSelector
      title={"Element Default Color"}
      value={props.setting.elementDefaultColor}
      setValue={function (value: string): void {
        const newSetting = structuredClone(props.setting);
        newSetting.elementDefaultColor = value;
        props.setSetting(newSetting);
      }} />
    <ColorSelector
      title={"Element Hilight Color"}
      value={props.setting.elementHilightColor}
      setValue={function (value: string): void {
        const newSetting = structuredClone(props.setting);
        newSetting.elementHilightColor = value;
        props.setSetting(newSetting);
      }} />
    <ColorSelector
      title={"Element Selection Color"}
      value={props.setting.elementSelectionColor}
      setValue={function (value: string): void {
        const newSetting = structuredClone(props.setting);
        newSetting.elementSelectionColor = value;
        props.setSetting(newSetting);
      }} />
    <ColorSelector
      title={"String Default Color"}
      value={props.setting.stringDefaultColor}
      setValue={function (value: string): void {
        const newSetting = structuredClone(props.setting);
        newSetting.stringDefaultColor = value;
        props.setSetting(newSetting);
      }} />
    <ColorSelector
      title={"String Disabled Color"}
      value={props.setting.stringDisabledColor}
      setValue={function (value: string): void {
        const newSetting = structuredClone(props.setting);
        newSetting.stringDisabledColor = value;
        props.setSetting(newSetting);
      }} />
    <ColorSelector
      title={"String Error Color"}
      value={props.setting.stringErrorColor}
      setValue={function (value: string): void {
        const newSetting = structuredClone(props.setting);
        newSetting.stringErrorColor = value;
        props.setSetting(newSetting);
      }} />
  </div>
}
