import { useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api';
import React from 'react';

import CommandBar from './CommandBar';
import { separator } from './FilePathSeparator';
import { IsValid, TabInfo, TabsInfo } from './PaineTabs';
import { PaineTabs } from './PaineTabs';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'

import JSON5 from 'json5'
import { LogMessagePein } from './LogMessagePein';


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

///////////////////////////////////////////////////////////////////////////////////////////////////
function GetActive(tab_info: TabsInfo) {
  return tab_info.pathAry[tab_info.activeTabIndex];
}

///////////////////////////////////////////////////////////////////////////////////////////////////
const App = () => {
  const getPath = () => {
    return GetActive(tabsPathAry.current[currentPainIndex]).path;
  }

  const [currentPainIndex, setCurrentPainIndex] = useState(0);
  const tabsPathAry = useRef<TabsInfo[]>(getInitTab());

  const onTabsChanged = (newTabs: TabInfo[], newTabIdx: number, painIndex: number) => {
    setCurrentPainIndex(painIndex);

    tabsPathAry.current[painIndex].pathAry = newTabs;
    tabsPathAry.current[painIndex].activeTabIndex = newTabIdx;

    const data = JSON5.stringify({ version: last_opend_setting_current_version, data: tabsPathAry.current }, null, 2);
    (async () => {
      await invoke<void>("write_setting_file", { filename: last_opend_setting_file_name, content: data })
    })()
  }

  const getOppositePath = () => {
    const oppositeIndex = (currentPainIndex + 1) % 2;
    return GetActive(tabsPathAry.current[oppositeIndex]).path;
  }

  const grid = [React.createRef<HTMLDivElement>(), React.createRef<HTMLDivElement>()];

  const [separator, setSeparator] = useState<separator>('\\');

  const [logMessagePein, logMessagePeinFunc] = LogMessagePein();
  const addLogMessage = (message: string) => {
    logMessagePeinFunc.addMessage(message);
  };

  return (
    <>
      <div
        css={css({
          display: 'grid',
          gridTemplateColumns: '0.8fr 0.2fr',
          width: '100%',
          height: '95vh',
        })}
      >
        <div
          css={css({
            display: 'grid',
            gridTemplateRows: '0.5fr 0.5fr auto',
            height: '100%',
          })}
        >
          {
            tabsPathAry.current.map((pathAry, idx) => {
              return <>
                <div
                  style={
                    {
                      border: (idx === currentPainIndex) ? '2px solid #ff0000' : '',
                      overflow: 'auto',
                    }
                  }
                  onFocus={() => { setCurrentPainIndex(idx); }}
                >
                  <PaineTabs
                    pathAry={pathAry}
                    onTabsChanged={(newTabs: TabInfo[], newTabIdx: number,) => onTabsChanged(newTabs, newTabIdx, idx)}
                    getOppositePath={getOppositePath}
                    addLogMessage={addLogMessage}
                    separator={separator}
                    gridRef={grid[idx]}
                    focusOppositePain={() => { grid[(idx + 1) % 2].current?.focus(); }}
                  />
                </div>
              </>
            })
          }
          <CommandBar
            path={getPath}
            addLogMessage={addLogMessage}
          />
        </div>
        <div
          css={css({
            display: 'grid',
            gridTemplateRows: '0.1fr auto',
            height: '100%',
          })}
        >
          <button
            css={css({
              width: '85pt',
              padding: '10px',
            })}
            onClick={() => { setSeparator(separator === '/' ? '\\' : '/') }}>
            separator:{separator}
          </button>
          {logMessagePein}
        </div>
      </div>
    </>
  );
}

export default App;
