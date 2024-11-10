import { useEffect, useState } from 'react';
import React from 'react';

import CommandBar from './CommandBar';
import { separator } from './FilePathSeparator';
import { PaneTabs } from './PaneTabs';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'

import { LogInfo, LogMessagePein } from './LogMessagePane';
import { TabColorSettings } from './TabColorSetting';

import { ReadLastOpenedTabs, TabInfo, TabsInfo, WriteLastOpenedTabs } from './TabsInfo';
import { BookMarkPane } from './BookMarkPane';
import { Updater } from './Updater';
import { invoke } from '@tauri-apps/api/core';

import { ErrorBoundary, FallbackProps } from 'react-error-boundary';

import { v4 as uuidv4 } from 'uuid';
import { ButtonStyle, useTheme } from './ThemeStyle';
import { ColorCodeString } from './ColorCodeString';

///////////////////////////////////////////////////////////////////////////////////////////////////
const statusBarHeight = 25;

///////////////////////////////////////////////////////////////////////////////////////////////////
function GetActive(tab_info: TabsInfo) {
  return tab_info.pathAry[tab_info.activeTabIndex];
}

///////////////////////////////////////////////////////////////////////////////////////////////////
export function MainModeView(
  props: {
    height: number,
    tabColorSetting?: TabColorSettings,
    setTabColor: (tabColorSettingTrgDir: string) => void,
    setFileListRowColor: () => void,
    setKeyBind: (trgKey: React.KeyboardEvent<HTMLDivElement> | null) => void,
    setContextMenu: () => void,
  }
) {
  const [tabsPathAry, setTabsPathAry] = useState<TabsInfo[]>([]);
  useEffect(() => {
    (async () => { setTabsPathAry(await ReadLastOpenedTabs()) })()
  }, []);

  const [currentPaneIndex, setCurrentPaneIndex] = useState(0);
  const [openSettings, setOpenSettings] = useState(false);
  const [itemNums, setItemNums] = useState<number[]>([0, 0]);
  const [selectItemNums, setSelectItemNums] = useState<number[]>([0, 0]);

  const [statasBarStr, setStatasBarStr] = useState("");
  useEffect(() => {
    setStatasBarStr(`Item:${itemNums[currentPaneIndex]}  Select:${selectItemNums[currentPaneIndex]}`);
  }, [itemNums, selectItemNums, currentPaneIndex]);
  const [separator, setSeparator] = useState<separator>('\\');

  const theme = useTheme();
  const buttonStyle = ButtonStyle(theme.baseColor);

  const backgroundColor = ColorCodeString.new(theme.baseColor.backgroundColor);
  if (backgroundColor) {
    invoke("set_background_color", { color: backgroundColor.toRGB() });
  }

  const getPath = () => {
    if (tabsPathAry.length === 0) { return ''; }
    return GetActive(tabsPathAry[currentPaneIndex]).path;
  }


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

  const setItemNum = (value: number, idx: number) => {
    setItemNums(cur => {
      let newVals = [...cur];
      newVals[idx] = value;
      return newVals;
    });
  }
  const setSelectItemNum = (value: number, idx: number) => {
    setSelectItemNums(cur => {
      let newVals = [...cur];
      newVals[idx] = value;
      return newVals;
    });
  }

  const grid = [React.createRef<HTMLDivElement>(), React.createRef<HTMLDivElement>()];


  const [logMessagePein, logMessagePeinFunc] = LogMessagePein({
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
    if (!settingDir) {
      addLogMessage({
        title: "Get setting dir failed.",
        stdout: '',
        stderr: "",
        id: uuidv4(),
        command: '',
        rc: null
      }); return;
    }
    addTab(settingDir)
  }

  const [commandBar, commandBarFunc] = CommandBar(
    {
      path: getPath,
      addLogMessage: addLogMessage,
      focusToFileList: () => grid[currentPaneIndex].current?.focus(),
    }
  )

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
            tabsPathAry
              // .slice(0, 1) // デバッグ用 1ペイン化
              .map((pathAry, idx) => {
                const isActive = idx === currentPaneIndex;
                return <div
                  style={
                    {
                      border: isActive ? '2px solid #ff0000' : '2px solid #ffffff',
                      overflow: 'auto',
                    }
                  }
                  onFocus={() => { setCurrentPaneIndex(idx); }}
                  key={'Tabs' + idx}
                >
                  <ErrorBoundary FallbackComponent={ErrorFallback}>
                    <PaneTabs
                      isActive={isActive}
                      panel_idx={idx}
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
                      focusCommandBar={() => commandBarFunc.focus()}
                      setKeyBind={props.setKeyBind}
                    />
                  </ErrorBoundary>
                </div>
              })
          }
          {commandBar}
        </div>
        <div
          css={css({
            display: 'grid',
            gridTemplateRows: 'auto 1fr auto', // Settings logPane statusBar
            height: props.height - 20,
          })}
        >
          <button
            css={css(buttonStyle)}
            onClick={() => { setOpenSettings(!openSettings) }}
          >settings</button>
          {
            openSettings ?
              SettingButtons(
                setSeparator,
                separator,
                props.setTabColor,
                props.setFileListRowColor,
                props.setKeyBind,
                props.setContextMenu,
                getPath,
                OpenSettingDir,
                Update)
              : <></>
          }
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


function SettingButtons(
  setSeparator: React.Dispatch<React.SetStateAction<separator>>,
  separator: string,
  setTabColor: (tabColorSettingTrgDir: string) => void,
  setFileListRowColor: () => void,
  setKeyBind: (trgKey: React.KeyboardEvent<HTMLDivElement> | null) => void,
  setContextMenu: () => void,
  getPath: () => string,
  OpenSettingDir: () => Promise<void>,
  Update: () => void
) {
  const buttonHeight = 50;

  const theme = useTheme();
  const buttonStyle = ButtonStyle(theme.baseColor);

  const settingButtonStyle = css(
    buttonStyle,
    {
      width: '85pt',
      height: buttonHeight,
      padding: '10px',
    });
  return <div
    css={css({
      display: 'grid',
      gridTemplateRows: 'repeat(7,auto) 1fr ',
    })}>
    <button
      css={settingButtonStyle}
      onClick={() => { setSeparator(separator === '/' ? '\\' : '/') }}>
      separator:{separator}
    </button>
    <button
      css={settingButtonStyle}
      onClick={() => setTabColor(getPath())}>
      Set Tab Color
    </button>
    <button
      css={settingButtonStyle}
      onClick={() => setFileListRowColor()}>
      Set File List Row Color
    </button>
    <button
      css={settingButtonStyle}
      onClick={() => setKeyBind(null)}>
      Set KeyBind
    </button>
    <button
      css={settingButtonStyle}
      onClick={() => setContextMenu()}>
      Set ContextMenu
    </button>
    <button
      css={settingButtonStyle}
      onClick={OpenSettingDir}>
      Setting Dir
    </button>
    <button
      css={settingButtonStyle}
      onClick={() => Update()}>
      Update
    </button>
  </div>;
}

