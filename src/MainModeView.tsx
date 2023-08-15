import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api';
import React from 'react';

import CommandBar from './CommandBar';
import { separator } from './FilePathSeparator';
import { PaneTabs } from './PaneTabs';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'

import { LogMessagePein } from './LogMessagePane';
import { TabColorSetting } from './TabColorSetting';

import { TabInfo, TabsInfo, WriteLastOpenedTabs } from './TabsInfo';


///////////////////////////////////////////////////////////////////////////////////////////////////
function GetActive(tab_info: TabsInfo) {
  return tab_info.pathAry[tab_info.activeTabIndex];
}

///////////////////////////////////////////////////////////////////////////////////////////////////
export function MainModeView(
  props: {
    height: number,
    tabsPathAry: TabsInfo[],
    tabColorSetting: TabColorSetting[],
    setTabColor: () => void,
  }
) {
  const getPath = () => {
    return GetActive(props.tabsPathAry[currentPaneIndex]).path;
  }

  const [currentPaneIndex, setCurrentPaneIndex] = useState(0);

  const onTabsChanged = (newTabs: TabInfo[], newTabIdx: number, paneIndex: number) => {
    setCurrentPaneIndex(paneIndex);

    props.tabsPathAry[paneIndex].pathAry = newTabs;
    props.tabsPathAry[paneIndex].activeTabIndex = newTabIdx;

    WriteLastOpenedTabs(props.tabsPathAry);
  }

  const getOppositePath = () => {
    const oppositeIndex = (currentPaneIndex + 1) % 2;
    return GetActive(props.tabsPathAry[oppositeIndex]).path;
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

  const commandBarHeight = 60; // とりあえず固定で。
  const paneHeight = ((props.height - commandBarHeight) / 2);

  return (
    <>
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
            props.tabsPathAry.map((pathAry, idx) => {
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
                <PaneTabs
                  height={paneHeight}
                  pathAry={pathAry}
                  tabColorSetting={props.tabColorSetting}
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
            gridTemplateRows: '0.1fr 0.1fr 0.1fr auto 0.1fr', // button button button logPane statusBar
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
            onClick={() => props.setTabColor()}>
            Set Tab Color
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
    </>
  );
}
