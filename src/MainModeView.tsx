import { useEffect, useState } from 'react';
import React from 'react';

import CommandBar from './CommandBar';
import { separator } from './FilePathSeparator';
import { PaneTabs } from './PaneTabs';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'

import { LogInfo, LogMessagePein } from './LogMessagePane';
import { TabColorSetting } from './TabColorSetting';

import { ReadLastOpenedTabs, TabInfo, TabsInfo, WriteLastOpenedTabs } from './TabsInfo';
import { BookMarkPane } from './BookMarkPane';
import { Updater } from './Updater';
import { invoke } from '@tauri-apps/api/tauri';

import { ErrorBoundary, FallbackProps } from 'react-error-boundary';

///////////////////////////////////////////////////////////////////////////////////////////////////
const buttonHeight = 50;
const statusBarHeight = 25;

///////////////////////////////////////////////////////////////////////////////////////////////////
function GetActive(tab_info: TabsInfo) {
  return tab_info.pathAry[tab_info.activeTabIndex];
}

///////////////////////////////////////////////////////////////////////////////////////////////////
export function MainModeView(
  props: {
    height: number,
    tabColorSetting: TabColorSetting[],
    setTabColor: (tabColorSettingTrgDir: string) => void,
    setKeyBind: () => void,
  }
) {
  const [tabsPathAry, setTabsPathAry] = useState<TabsInfo[]>([]);
  useEffect(() => {
    (async () => { setTabsPathAry(await ReadLastOpenedTabs()) })()
  }, []);


  const getPath = () => {
    if (tabsPathAry.length === 0) { return ''; }
    return GetActive(tabsPathAry[currentPaneIndex]).path;
  }

  const [currentPaneIndex, setCurrentPaneIndex] = useState(0);

  const onTabsChanged = (newTabs: TabInfo[], newTabIdx: number, paneIndex: number) => {
    setCurrentPaneIndex(paneIndex);

    const newTabsPathAry = [...tabsPathAry];

    newTabsPathAry[paneIndex].pathAry = newTabs;
    newTabsPathAry[paneIndex].activeTabIndex = newTabIdx;

    setTabsPathAry(newTabsPathAry);
    WriteLastOpenedTabs(newTabsPathAry);
  }

  const addTab = (dir: string) => {
    const newTabsPathAry = [...tabsPathAry];

    const tabsInfo = { ...newTabsPathAry[currentPaneIndex] };

    const pathAry = tabsInfo.pathAry;
    const tabIdx = tabsInfo.activeTabIndex;
    pathAry.splice(tabIdx + 1, 0, { path: dir, pined: false });
    tabsInfo.activeTabIndex = tabIdx + 1;

    newTabsPathAry[currentPaneIndex] = tabsInfo

    setTabsPathAry(newTabsPathAry)
    WriteLastOpenedTabs(newTabsPathAry);
  }

  const getOppositePath = () => {
    if (tabsPathAry.length === 0) { return ''; }
    const oppositeIndex = (currentPaneIndex + 1) % 2;
    return GetActive(tabsPathAry[oppositeIndex]).path;
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

  const [logMessagePein, logMessagePeinFunc] = LogMessagePein({
    height: props.height -20 - (buttonHeight * 5 + statusBarHeight),
  });
  const addLogMessage = (message: LogInfo) => {
    logMessagePeinFunc.addMessage(message);
  };

  const [updateDlg, Update] = Updater(addLogMessage);

  const commandBarHeight = 60; // とりあえず固定で。
  const borderThickness = 2;
  const paneHeight = ((props.height - commandBarHeight) / 2) - (borderThickness * 2);

  async function OpenSettingDir(): Promise<void> {
    const settingDir = await invoke<string>("setting_dir", {}).catch(_ => null);
    if (!settingDir) { addLogMessage({ title: "Get setting dir failed.", stdout: '', stderr: "" }); return; }
    addTab(settingDir)
  }

  function ErrorFallback({
    error,
    resetErrorBoundary }: FallbackProps
  ) {
    console.log("erro");
    return (
      <div>
        <h3>Error</h3>
        <p>{error.message}</p>
        <button onClick={resetErrorBoundary}>Reload</button>
      </div>
    );
  }

  return (
    <>
      {updateDlg}
      <div
        css={css({
          display: 'grid',
          gridTemplateColumns: '0.2fr 0.6fr 0.2fr', // bookmark panes options
          overflow: 'auto',
        })}
      >
        <div>
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <BookMarkPane
              height={props.height}
              colorSetting={props.tabColorSetting}
              currendDir={getPath()}
              accessDirectry={addTab}
            />
          </ErrorBoundary>
        </div>
        <div
          css={css({
            display: 'grid',
            gridTemplateRows: 'auto auto auto', // Pane Pane commandBar
          })}
        >
          {
            tabsPathAry.map((pathAry, idx) => {
              return <div
                style={
                  {
                    border: (idx === currentPaneIndex) ? '2px solid #ff0000' : '2px solid #ffffff',
                    overflow: 'auto',
                  }
                }
                onFocus={() => { setCurrentPaneIndex(idx); }}
                key={'Tabs' + idx}
              >
                <ErrorBoundary FallbackComponent={ErrorFallback}>
                  <PaneTabs
                    height={paneHeight}
                    pathAry={pathAry}
                    tabColorSetting={props.tabColorSetting}
                    onTabsChanged={(newTabs: TabInfo[], newTabIdx: number,) => onTabsChanged(newTabs, newTabIdx, idx)}
                    onItemNumChanged={(newItemNum: number) => setItemNum(newItemNum, idx)}
                    onSelectItemNumChanged={(newSelectItemNum: number) => setSelectItemNum(newSelectItemNum, idx)}
                    getOppositePath={getOppositePath}
                    addLogMessage={addLogMessage}
                    setTabColor={props.setTabColor}
                    separator={separator}
                    gridRef={grid[idx]}
                    focusOppositePane={() => { grid[(idx + 1) % 2].current?.focus(); }}
                  />
                </ErrorBoundary>
              </div>
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
            gridTemplateRows: '0.1fr 0.1fr 0.1fr 0.1fr 0.1fr 0.4f 0.1fr', // button button button button button logPane statusBar
            // height: '100%',
            height: props.height - 20,
            // overflow: 'scroll',
          })}
        >
          <button
            css={css({
              width: '85pt',
              height: buttonHeight,
              padding: '10px',
            })}
            onClick={() => { setSeparator(separator === '/' ? '\\' : '/') }}>
            separator:{separator}
          </button>
          <button
            css={css({
              width: '85pt',
              height: buttonHeight,
              padding: '10px',
            })}
            onClick={() => props.setTabColor(getPath())}>
            Set Tab Color
          </button>
          <button
            css={css({
              width: '85pt',
              height: buttonHeight,
              padding: '10px',
            })}
            onClick={() => props.setKeyBind()}>
            Set KeyBind
          </button>
          <button
            css={css({
              width: '85pt',
              height: buttonHeight,
              padding: '10px',
            })}
            onClick={OpenSettingDir}>
            Setting Dir
          </button>
          <button
            css={css({
              width: '85pt',
              height: buttonHeight,
              padding: '10px',
            })}
            onClick={() => Update()}>
            Update
          </button>
          {logMessagePein}
          <div // statas bar
            css={css({
              height: statusBarHeight,
              textAlign: 'right',
            })}
          >
            {statasBarStr}
          </div>
        </div>
      </div>
    </>
  );
}
