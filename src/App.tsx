import { useEffect, useRef, useState } from 'react';
import { MainModeView } from './MainModeView';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import { TabColorSetting, readTabColorSetting, writeTabColorSetting } from './TabColorSetting';
import { IsValid, TabsInfo } from './PaneTabs';
import { invoke } from '@tauri-apps/api';

import { TabColorSettingPane } from './TabColorSettingPane';

import JSON5 from 'json5'

///////////////////////////////////////////////////////////////////////////////////////////////////
const last_opend_setting_file_name = "last_opend.json5";
const last_opend_setting_current_version = 1;

const initTabs = await invoke<String>("read_setting_file", { filename: last_opend_setting_file_name });
const defaultDir = await invoke<string>("get_exe_dir", {});
const getInitTab = () => {
  const defaultTabInfo = { pathAry: [{ path: defaultDir, pined: false }], activeTabIndex: 0 }

  try {
    let result = JSON5.parse(initTabs.toString()) as { version: number, data: TabsInfo[], };
    if (result.data.length !== 2) {
      return [{ ...defaultTabInfo }, { ...defaultTabInfo }];
    }

    const fixError = (tabInfo: TabsInfo) => {
      tabInfo.pathAry = tabInfo.pathAry.filter(tabInfo => IsValid(tabInfo));
      if (tabInfo.pathAry.length === 0) {
        tabInfo.pathAry.push({ path: defaultDir, pined: false })
      }

      if (tabInfo.activeTabIndex < 0 || tabInfo.pathAry.length <= tabInfo.activeTabIndex) {
        tabInfo.activeTabIndex = 0
      }

      return tabInfo;
    }

    return result.data.map(fixError);
  } catch {
    return [{ ...defaultTabInfo }, { ...defaultTabInfo }];
  }
}

export function writeLastOpenedTabs(value:TabsInfo[]) {
  const data = JSON5.stringify({ version: last_opend_setting_current_version, data: value }, null, 2);
  (async () => {
    await invoke<void>("write_setting_file", { filename: last_opend_setting_file_name, content: data })
  })()
}

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

  const tabsPathAry = useRef<TabsInfo[]>(getInitTab());

  const viewImpl = () => {
    switch (mode) {
      case Mode.main:
        return <MainModeView
          height={aplHeight}
          tabsPathAry={tabsPathAry.current}
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

  return <body
    css={css({
      width: '100%',
      height: 'aplHeight',
      overflow: 'hidden',
      userSelect: 'none',
    })}
  >
    {viewImpl()}
  </body >
}

export default App;
