import { useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api';
import { homeDir } from '@tauri-apps/api/path';
import React from 'react';


import 'jqwidgets-scripts/jqwidgets/styles/jqx.base.css';
import 'jqwidgets-scripts/jqwidgets/styles/jqx.material-purple.css';
import JqxGrid, { } from 'jqwidgets-scripts/jqwidgets-react-tsx/jqxgrid';

import CommandBar from './CommandBar';
import { separator } from './FilePathSeparator';
import { PaineTabs, TabInfo } from './MainPain';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'

import JSON5 from 'json5'


///////////////////////////////////////////////////////////////////////////////////////////////////
const last_opend_setting_file_name = "last_opend.json5";

const initTabs = await invoke<String>("read_setting_file", { filename: last_opend_setting_file_name });
const defaultDir = await homeDir();
const getInitTab = () => {
  const defaultTabInfo = { pathAry: [defaultDir], activeTabIndex: 0 }

  try {
    let result = JSON5.parse(initTabs.toString()) as TabInfo[];
    if (result.length !== 2) {
      return [{ ...defaultTabInfo }, { ...defaultTabInfo }];
    }

    const fixError = (tabInfo: TabInfo) => {
      tabInfo.pathAry = tabInfo.pathAry.filter(s => s);
      if (tabInfo.pathAry.length === 0) {
        tabInfo.pathAry.push(defaultDir)
      }

      if (tabInfo.activeTabIndex < 0 || tabInfo.pathAry.length <= tabInfo.activeTabIndex) {
        tabInfo.activeTabIndex = 0
      }

      return tabInfo;
    }

    return result.map(fixError);
  } catch {
    return [{ ...defaultTabInfo }, { ...defaultTabInfo }];
  }
}

///////////////////////////////////////////////////////////////////////////////////////////////////
function GetActive(tab_info: TabInfo) {
  return tab_info.pathAry[tab_info.activeTabIndex];
}

///////////////////////////////////////////////////////////////////////////////////////////////////
const App = () => {
  const getPath = () => {
    return GetActive(tabsPathAry.current[currentPainIndex]);
  }

  const [currentPainIndex, setCurrentPainIndex] = useState(0);
  const tabsPathAry = useRef<TabInfo[]>(getInitTab());

  const onTabsChanged = (newTabs: string[], newTabIdx: number, painIndex: number) => {
    setCurrentPainIndex(painIndex);

    tabsPathAry.current[painIndex].pathAry = newTabs;
    tabsPathAry.current[painIndex].activeTabIndex = newTabIdx;

    const data = JSON5.stringify(tabsPathAry.current, null, 2);
    (async () => {
      await invoke<void>("write_setting_file", { filename: last_opend_setting_file_name, content: data })
    })()
  }

  const getOppositePath = () => {
    const oppositeIndex = (currentPainIndex + 1) % 2;
    return GetActive(tabsPathAry.current[oppositeIndex]);
  }

  const grid = [React.createRef<HTMLDivElement>(), React.createRef<HTMLDivElement>()];

  const [separator, setSeparator] = useState<separator>('\\');
  return (
    <div
      css={css({
        display: 'grid',
        gridTemplateRows: 'auto 0.5fr 0.5fr auto',
        width: '95%',
        height: '95vh',
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
                onTabsChanged={(newTabs: string[], newTabIdx: number,) => onTabsChanged(newTabs, newTabIdx, idx)}
                getOppositePath={getOppositePath}
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
      />
    </div >
  );
}

export default App;
