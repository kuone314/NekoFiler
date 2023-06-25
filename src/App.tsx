import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api';
import React from 'react';

import CommandBar from './CommandBar';
import { separator } from './FilePathSeparator';
import { IsValid, TabInfo, TabsInfo } from './PaneTabs';
import { PaneTabs } from './PaneTabs';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'

import JSON5 from 'json5'
import { LogMessagePein } from './LogMessagePane';


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
    return GetActive(tabsPathAry.current[currentPaneIndex]).path;
  }

  const [currentPaneIndex, setCurrentPaneIndex] = useState(0);
  const tabsPathAry = useRef<TabsInfo[]>(getInitTab());

  const onTabsChanged = (newTabs: TabInfo[], newTabIdx: number, paneIndex: number) => {
    setCurrentPaneIndex(paneIndex);

    tabsPathAry.current[paneIndex].pathAry = newTabs;
    tabsPathAry.current[paneIndex].activeTabIndex = newTabIdx;

    const data = JSON5.stringify({ version: last_opend_setting_current_version, data: tabsPathAry.current }, null, 2);
    (async () => {
      await invoke<void>("write_setting_file", { filename: last_opend_setting_file_name, content: data })
    })()
  }

  const getOppositePath = () => {
    const oppositeIndex = (currentPaneIndex + 1) % 2;
    return GetActive(tabsPathAry.current[oppositeIndex]).path;
  }

  const [itemNums, setItemNums] = useState<number[]>([0, 0]);
  const setItemNum = (value: number, idx: number) => {
    setItemNums(cur => {
      let newVals = [...cur];
      newVals[idx] = value;
      return newVals;
    });
  }
  const [selectItemNums, setSelectItemNums] = useState<number[]>([0, 0]);
  const setSelectItemNum = (value: number, idx: number) => {
    setSelectItemNums(cur => {
      let newVals = [...cur];
      newVals[idx] = value;
      return newVals;
    });
  }
  const [statasBarStr, setStatasBarStr] = useState("");
  useEffect(() => {
    setStatasBarStr(`Item:${itemNums[currentPaneIndex]}  Select:${selectItemNums[currentPaneIndex]}`);
  }, [itemNums, selectItemNums, currentPaneIndex]);


  const grid = [React.createRef<HTMLDivElement>(), React.createRef<HTMLDivElement>()];

  const [separator, setSeparator] = useState<separator>('\\');

  const [logMessagePein, logMessagePeinFunc] = LogMessagePein();
  const addLogMessage = (message: string) => {
    logMessagePeinFunc.addMessage(message);
  };

  const Update = () => {
    invoke<void>("update_filer", {}).catch(
      message => addLogMessage(message))
  }

  const [aplHeight, setAplHeight] = useState(document.documentElement.clientHeight);
  const commandBarHeight = 60; // とりあえず固定で。
  const [paneHeight, setPaneHeight] = useState((document.documentElement.clientHeight - commandBarHeight) / 2);
  window.addEventListener('resize', (event) => {
    setAplHeight(document.documentElement.clientHeight);
    setPaneHeight((document.documentElement.clientHeight - commandBarHeight) / 2);
  })

  return (
    <>
      <body
        css={css({
          width: '100%',
          height: 'aplHeight',
          overflow: 'hidden',
          userSelect: 'none',
        })}
      >
        <div
          css={css({
            display: 'grid',
            gridTemplateColumns: '0.8fr 0.2fr', // panes options
            height: 'aplHeight',
            overflow: 'auto',
          })}
        >
          <div
            css={css({
              display: 'grid',
              gridTemplateRows: 'auto auto auto', // Pane Pane commandBar
              height: 'aplHeight',
            })}
          >
            {
              tabsPathAry.current.map((pathAry, idx) => {
                return <>
                  <div
                    style={
                      {
                        border: (idx === currentPaneIndex) ? '2px solid #ff0000' : '',
                        overflow: 'auto',
                      }
                    }
                    onFocus={() => { setCurrentPaneIndex(idx); }}
                  >
                    <PaneTabs
                      height={paneHeight}
                      pathAry={pathAry}
                      onTabsChanged={(newTabs: TabInfo[], newTabIdx: number,) => onTabsChanged(newTabs, newTabIdx, idx)}
                      onItemNumChanged={(newItemNum: number) => setItemNum(newItemNum, idx)}
                      onSelectItemNumChanged={(newSelectItemNum: number) => setSelectItemNum(newSelectItemNum, idx)}
                      getOppositePath={getOppositePath}
                      addLogMessage={addLogMessage}
                      separator={separator}
                      gridRef={grid[idx]}
                      focusOppositePane={() => { grid[(idx + 1) % 2].current?.focus(); }}
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
              gridTemplateRows: '0.1fr 0.1fr auto 0.1fr', // button button logPane statusBar
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
            <button
              css={css({
                width: '85pt',
                padding: '10px',
              })}
              onClick={() => Update()}>
              Update
            </button>
            {logMessagePein}
            <div // statas bar
              css={css({
                textAlign: 'right',
              })}
            >
              {statasBarStr}
            </div>
          </div>
        </div>
      </body>
    </>
  );
}

export default App;
