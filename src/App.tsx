import { useEffect, useRef, useState } from 'react';
import { MainModeView } from './MainModeView';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import { TabColorSetting, readTabColorSetting, writeTabColorSetting } from './TabColorSetting';

import { TabColorSettingPane } from './TabColorSettingPane';

import { ReadLastOpenedTabs, TabsInfo } from './TabsInfo';


///////////////////////////////////////////////////////////////////////////////////////////////////
const Mode = {
  main: "main",
  setTabColor: "setTabColor",
} as const;
type Mode = typeof Mode[keyof typeof Mode];

///////////////////////////////////////////////////////////////////////////////////////////////////
const App = () => {
  const [mode, setMode] = useState<Mode>(Mode.main);

  const [aplHeight, setAplHeight] = useState(document.documentElement.clientHeight);
  window.addEventListener('resize', (event) => {
    setAplHeight(document.documentElement.clientHeight);
  })

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
          setTabColor={() => setMode(Mode.setTabColor)}
        />
      case Mode.setTabColor:
        return <TabColorSettingPane
          height={aplHeight}
          tabColorSetting={tabColorSetting}
          setTabColorSetting={(setting) => {
            setTabColorSetting(setting);
            writeTabColorSetting(setting);
          }}
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
