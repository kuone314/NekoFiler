import { useEffect, useRef, useState } from 'react';
import React from 'react';

import CommandBar from './CommandBar';
import { separator } from './FilePathSeparator';
import { PaneTabs } from './PaneTabs';

/** @jsxImportSource @emotion/react */
import { css, SerializedStyles } from '@emotion/react'

import { LogInfo, LogMessagePein, LogMessagePeinFunc } from './LogMessagePane';
import { TabColorSettings } from './TabColorSetting';

import { ReadLastOpenedTabs, TabInfo, TabsInfo, WriteLastOpenedTabs } from './TabsInfo';
import { BookMarkPane } from './BookMarkPane';
import { Updater } from './Updater';
import { invoke } from '@tauri-apps/api/core';

import { ErrorBoundary, FallbackProps } from 'react-error-boundary';

import { v4 as uuidv4 } from 'uuid';
import { ButtonStyle, useTheme } from './ThemeStyle';
import { TabNameSettings } from './TabNameSetting';

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
    tabNameSettings?: TabNameSettings;
    setBaseColor: () => void,
    setTabColor: (tabSettingTrgDir: string) => void,
    setTabName: (tabSettingTrgDir: string) => void,
    setFileListRowColor: () => void,
    setKeyBind: (trgKey: React.KeyboardEvent<HTMLDivElement> | null) => void,
    setContextMenu: () => void,
  }
) {
  const [tabsPathAry, setTabsPathAry] = useState<TabsInfo[]>([]);
  const [ignoreSystemFile, setIgnoreSystemFile] = useState(true);

  useEffect(() => {
    invoke<boolean>("set_ignore_system_file", { value: ignoreSystemFile });
  }, [ignoreSystemFile]);

  useEffect(() => {
    (async () => {
      setTabsPathAry(await ReadLastOpenedTabs());
      setIgnoreSystemFile(await invoke<boolean>("is_ignore_system_file"));
    })()
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

  const addTab = (paneIndex: number, dir: string) => {
    const newTabsPathAry = [...tabsPathAry];

    const tabsInfo = { ...newTabsPathAry[paneIndex] };

    const pathAry = tabsInfo.pathAry;
    const tabIdx = tabsInfo.activeTabIndex;
    pathAry.splice(tabIdx + 1, 0, { path: dir, pined: false });
    tabsInfo.activeTabIndex = tabIdx + 1;

    newTabsPathAry[paneIndex] = tabsInfo

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


  const logMessagePeinFunc = useRef<LogMessagePeinFunc>(null);

  const addLogMessage = (message: LogInfo) => {
    logMessagePeinFunc.current?.addMessage(message);
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
    addTab(currentPaneIndex, settingDir)
  }

  function duplicateTabToOppositePane(dirPath: string) {
    const oppositeIndex = (currentPaneIndex + 1) % 2;
    addTab(oppositeIndex, dirPath);
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

  const buttonHeight = 50;
  const settingButtonStyle = css(
    buttonStyle,
    {
      width: '85pt',
      height: buttonHeight,
      padding: '10px',
    });

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
              accessDirectry={(dir: string) => addTab(currentPaneIndex, dir)}
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
                      tabNameSettings={props.tabNameSettings}
                      onTabsChanged={(newTabs: TabInfo[], newTabIdx: number,) => onTabsChanged(newTabs, newTabIdx, idx)}
                      onItemNumChanged={(newItemNum: number) => setItemNum(newItemNum, idx)}
                      onSelectItemNumChanged={(newSelectItemNum: number) => setSelectItemNum(newSelectItemNum, idx)}
                      getOppositePath={getOppositePath}
                      addLogMessage={addLogMessage}
                      setTabColor={props.setTabColor}
                      setTabName={props.setTabName}
                      separator={separator}
                      gridRef={grid[idx]}
                      focusOppositePane={() => { grid[(idx + 1) % 2].current?.focus(); }}
                      focusCommandBar={() => commandBarFunc.focus()}
                      setKeyBind={props.setKeyBind}
                      duplicateTabToOppositePane={duplicateTabToOppositePane}
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
            gridTemplateRows: 'auto auto auto 1fr auto', // Separator CheckBox Settings logPane statusBar
            height: props.height - 20,
          })}
        >
          <button
            css={settingButtonStyle}
            onClick={() => { setSeparator(separator === '/' ? '\\' : '/') }}>
            separator:{separator}
          </button>

          <label>
            <input
              type='checkbox'
              checked={ignoreSystemFile}
              onChange={(_) => setIgnoreSystemFile(!ignoreSystemFile)}
            />
            Ignore System File
          </label>

          <button
            css={css(buttonStyle)}
            onClick={() => { setOpenSettings(!openSettings) }}
          >settings</button>
          {
            openSettings ?
              SettingButtons(
                settingButtonStyle,
                props.setBaseColor,
                props.setTabColor,
                props.setTabName,
                props.setFileListRowColor,
                props.setKeyBind,
                props.setContextMenu,
                getPath,
                OpenSettingDir,
                Update)
              : <></>
          }
          <LogMessagePein
            ref={logMessagePeinFunc}
          />
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
  settingButtonStyle: SerializedStyles,
  setBaseColor: () => void,
  setTabColor: (tabSettingTrgDir: string) => void,
  setTabName: (tabSettingTrgDir: string) => void,
  setFileListRowColor: () => void,
  setKeyBind: (trgKey: React.KeyboardEvent<HTMLDivElement> | null) => void,
  setContextMenu: () => void,
  getPath: () => string,
  OpenSettingDir: () => Promise<void>,
  Update: () => void
) {
  return <div
    css={css({
      display: 'grid',
      gridTemplateRows: 'repeat(7,auto) 1fr ',
    })}>
    <button
      css={settingButtonStyle}
      onClick={() => setBaseColor()}>
      Set Base Color
    </button>
    <button
      css={settingButtonStyle}
      onClick={() => setTabColor(getPath())}>
      Set Tab Color
    </button>
    <button
      css={settingButtonStyle}
      onClick={() => setTabName(getPath())}>
      Set Tab Name
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

