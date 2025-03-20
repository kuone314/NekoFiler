import { useEffect, useState } from 'react';
import { MainModeView } from './MainModeView';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import { TabColorSettings, readTabColorSetting, writeTabColorSetting } from './TabColorSetting';

import { TabColorSettingPane } from './TabColorSettingPane';

import { KeyBindSettingPane } from './KeyBindSettingPane';
import { ContextMenuSettingPane } from './ContextMenuSettingPane';
import { FileListRowColorSettingPane } from './FileListRowColorSettingPane';
import { ThemeProvider, useTheme } from './ThemeStyle';
import { readBaseColor } from './BaseColorSetting';
import { BaseColorSettingPane } from './BaseColorSettingPane';
import { readTabNameSetting, TabNameSettings } from './TabNameSetting';


///////////////////////////////////////////////////////////////////////////////////////////////////
const Mode = {
  main: "main",
  setTabColor: "setTabColor",
  setBaseColors: "setBaseColors",
  setFileListRowColor: "setFileListRowColor",
  setKeyBindSettings: "setKeyBindSettings",
  setContextMenu: "setContextMenu",
} as const;
type Mode = typeof Mode[keyof typeof Mode];

///////////////////////////////////////////////////////////////////////////////////////////////////
function ViewImpl(): JSX.Element {
  const [mode, setMode] = useState<Mode>(Mode.main);
  const [keySetTrg, setKeySetTrg] = useState<React.KeyboardEvent<HTMLDivElement> | null>(null);

  const [aplHeight, setAplHeight] = useState(document.documentElement.clientHeight);
  window.addEventListener('resize', (_) => {
    setAplHeight(document.documentElement.clientHeight);
  })

  const [tabSettingTrgDir, setTabSettingTrgDir] = useState<string>('');
  const [tabColorSetting, setTabColorSetting] = useState<TabColorSettings>();
  const [tabNameSettings, setTabNameSettings] = useState<TabNameSettings>();

  const theme = useTheme();
  useEffect(() => {
    (async () => {
      const color_seting = await readTabColorSetting();
      setTabColorSetting(color_seting);
      const tab_name_seting = await readTabNameSetting();
      setTabNameSettings(tab_name_seting);
      const colorSetting = await readBaseColor();
      theme.setBaseColor(colorSetting);
    })()
  }, []);

  const Impl = () => {
    switch (mode) {
      case Mode.main:
        return <MainModeView
          height={aplHeight}
          tabColorSetting={tabColorSetting}
          tabNameSettings={tabNameSettings}
          setBaseColor={() => { setMode(Mode.setBaseColors); }}
          setFileListRowColor={() => { setMode(Mode.setFileListRowColor); }}
          setTabColor={(trgDir) => { setTabSettingTrgDir(trgDir); setMode(Mode.setTabColor) }}
          setKeyBind={(trgKey: React.KeyboardEvent<HTMLDivElement> | null) => { setKeySetTrg(trgKey); setMode(Mode.setKeyBindSettings) }}
          setContextMenu={() => { setMode(Mode.setContextMenu); }}
        />
      case Mode.setBaseColors:
        return <BaseColorSettingPane
          height={aplHeight - 20}
          finishSetting={() => setMode(Mode.main)}
        />
      case Mode.setTabColor:
        return <TabColorSettingPane
          height={aplHeight}
          trgDir={tabSettingTrgDir}
          tabColorSetting={tabColorSetting}
          setTabColorSetting={(setting) => {
            setTabColorSetting(setting);
            writeTabColorSetting(setting);
          }}
          finishSetting={() => setMode(Mode.main)}
        />
      case Mode.setFileListRowColor:
        return <FileListRowColorSettingPane
          height={aplHeight}
          finishSetting={() => setMode(Mode.main)}
        />
      case Mode.setKeyBindSettings:
        return <KeyBindSettingPane
          height={aplHeight - 20}
          keySetTrg={keySetTrg}
          finishSetting={() => setMode(Mode.main)}
        />
      case Mode.setContextMenu:
        return <ContextMenuSettingPane
          height={aplHeight - 20}
          finishSetting={() => setMode(Mode.main)}
        />
    }
  };

  return <div
    css={css({
      width: '100%',
      height: 'aplHeight',
      overflow: 'hidden',
      userSelect: 'none',
      background: theme.baseColor.backgroundColor,
      color: theme.baseColor.stringDefaultColor,
      scrollbarColor: theme.baseColor.stringDefaultColor + ' ' + theme.baseColor.elementDefaultColor
    })}
  >
    <style>
      {`
          input::selection {
            background-color: ${theme.baseColor.elementSelectionColor}
          }
        `}
    </style>
    {Impl()}
  </div >

}

const App = () => {

  return <ThemeProvider>
    <ViewImpl />
  </ThemeProvider>
}

export default App;
