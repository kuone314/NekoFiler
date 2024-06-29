import { useEffect, useRef, useState } from 'react';
import { MainModeView } from './MainModeView';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import { TabColorSetting, readTabColorSetting, writeTabColorSetting } from './TabColorSetting';

import { TabColorSettingPane } from './TabColorSettingPane';

import { ReadLastOpenedTabs, TabsInfo } from './TabsInfo';
import { KeyBindSettingPane } from './KeyBindSettingPane';
import { ContextMenuSettingPane } from './ContextMenuSettingPane';
import { FileListRowColorSettingPane } from './FileListRowColorSettingPane';


///////////////////////////////////////////////////////////////////////////////////////////////////
const Mode = {
  main: "main",
  setTabColor: "setTabColor",
  setFileListRowColor: "setFileListRowColor",
  setKeyBindSettings: "setKeyBindSettings",
  setContextMenu: "setContextMenu",
} as const;
type Mode = typeof Mode[keyof typeof Mode];

///////////////////////////////////////////////////////////////////////////////////////////////////
const App = () => {
  const [mode, setMode] = useState<Mode>(Mode.main);
  const [keySetTrg, setKeySetTrg] = useState<React.KeyboardEvent<HTMLDivElement> | null>(null);

  const [aplHeight, setAplHeight] = useState(document.documentElement.clientHeight);
  window.addEventListener('resize', (event) => {
    setAplHeight(document.documentElement.clientHeight);
  })

  const [tabColorSettingTrgDir, setTabColorSettingTrgDir] = useState<string>('');
  const [tabColorSetting, setTabColorSetting] = useState<TabColorSetting[]>([]);
  useEffect(() => {
    (async () => {
      const color_seting = await readTabColorSetting();
      setTabColorSetting(color_seting);
    })()
  }, []);

  const viewImpl = () => {
    switch (mode) {
      case Mode.main:
        return <MainModeView
          height={aplHeight}
          tabColorSetting={tabColorSetting}
          setFileListRowColor={() => { setMode(Mode.setFileListRowColor); }}
          setTabColor={(trgDir) => { setTabColorSettingTrgDir(trgDir); setMode(Mode.setTabColor) }}
          setKeyBind={(trgKey: React.KeyboardEvent<HTMLDivElement> | null) => { setKeySetTrg(trgKey); setMode(Mode.setKeyBindSettings) }}
          setContextMenu={() => { setMode(Mode.setContextMenu); }}
        />
      case Mode.setTabColor:
        return <TabColorSettingPane
          height={aplHeight}
          trgDir={tabColorSettingTrgDir}
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
          trgDir={tabColorSettingTrgDir}
          tabColorSetting={tabColorSetting}
          setTabColorSetting={(setting) => {
            setTabColorSetting(setting);
            writeTabColorSetting(setting);
          }}
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
    })}
  >
    {viewImpl()}
  </div >
}

export default App;
