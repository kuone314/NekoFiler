import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api';
import React from 'react';

import { Button } from '@mui/material';


import { SEPARATOR, separator, ApplySeparator } from './FilePathSeparator';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'

import { TabColorSetting, readTabColorSetting } from './TabColorSetting';

import { MainPanel } from './MainPain';

///////////////////////////////////////////////////////////////////////////////////////////////////
export interface TabInfo {
  path: string,
  pined: boolean,
}
export function IsValid(tabInfo: TabInfo) {
  if (!tabInfo) { return false; }
  if (!tabInfo.path) { return false; }
  return true;
}
export interface TabsInfo {
  pathAry: TabInfo[],
  activeTabIndex: number,
}

///////////////////////////////////////////////////////////////////////////////////////////////////
export const PaineTabs = (
  props: {
    height: number,
    pathAry: TabsInfo,
    onTabsChanged: (newTabs: TabInfo[], newTabIdx: number,) => void,
    onItemNumChanged: (newItemNum: number) => void,
    onSelectItemNumChanged: (newSelectItemNum: number) => void,
    getOppositePath: () => string,
    addLogMessage: (message: string) => void,
    separator: separator,
    focusOppositePain: () => void,
    gridRef?: React.RefObject<HTMLDivElement>,
  },
) => {
  const [tabAry, setTabAry] = useState<TabInfo[]>(props.pathAry.pathAry);
  const [activeTabIdx, setActiveTabIdx] = useState<number>(props.pathAry.activeTabIndex);

  const [colorSetting, setColorSetting] = useState<TabColorSetting[]>([]);
  useEffect(() => {
    (async () => {
      const color_seting = await readTabColorSetting();
      setColorSetting(color_seting);
    })()
  }, []);

  const addNewTab = (addPosIdx: number, newTabPath: string) => {
    let newTabAry = Array.from(tabAry);
    newTabAry.splice(addPosIdx + 1, 0, { path: newTabPath, pined: false });
    setTabAry(newTabAry);
    setActiveTabIdx(addPosIdx + 1);
  }
  const removeTab = (trgIdx: number) => {
    if (tabAry.length === 1) { return; }
    if (trgIdx >= tabAry.length) { return; }
    if (tabAry[trgIdx].pined) { return; }

    let newTabAry = Array.from(tabAry);
    newTabAry.splice(trgIdx, 1);
    setTabAry(newTabAry);

    if (activeTabIdx >= newTabAry.length) {
      setActiveTabIdx(newTabAry.length - 1);
    }
  }
  const changeTab = (offset: number) => {
    const new_val = (activeTabIdx + offset + tabAry.length) % tabAry.length;
    setActiveTabIdx(new_val);
  }
  const togglePined = (idx: number) => {
    let newTabAry = Array.from(tabAry);
    newTabAry[idx].pined = !newTabAry[idx].pined;
    setTabAry(newTabAry);
  }

  const onPathChanged = (newPath: string) => {
    tabAry[activeTabIdx].path = newPath
    setTabAry(Array.from(tabAry));
  }

  useEffect(() => {
    props.onTabsChanged(tabAry, activeTabIdx);
  }, [tabAry, activeTabIdx]);

  const pathToTabName = (tab: TabInfo) => {
    const pinedPrefix = tab.pined ? "*:" : "";
    const dirName = (() => {
      const splited = ApplySeparator(tab.path, '/').split('/').reverse();
      if (splited[0].length !== 0) { return splited[0]; }
      return splited[1];
    })();
    return pinedPrefix + dirName;
  }

  const tabColor = (path: string) => {
    try {
      const match = (setting: TabColorSetting): boolean => {
        const pathRegExp = new RegExp(setting.pathRegExp, 'i');
        const path_ary = Object.values(SEPARATOR)
          .map(separator => ApplySeparator(path, separator) + separator);
        return !!path_ary.find(path => pathRegExp.test(path));
      }
      const setting = colorSetting.find(s => match(s));
      if (!setting) { return ``; }
      return css({
        background: setting.color.backGround,
        color: setting.color.string,
      })
    } catch {
      return '';
    }
  };

  return (
    <>
      <div
        css={css({
          display: 'grid',
          gridTemplateRows: 'auto 1fr',
          overflow: 'auto',
          width: '100%',
          height: props.height,
        })}
      >
        <div css={css({ textTransform: 'none' })}>
          {
            tabAry.map((tab, idx) => {
              return <Button
                css={[
                  css({
                    textTransform: 'none',
                    border: (idx === activeTabIdx) ? '5px solid #ff0000' : '',
                    fontSize: '10pt',
                    height: '20pt',
                    margin: '1pt',
                    minWidth: '5pt'
                  }),
                  tabColor(tab.path),
                ]}
                onClick={() => { setActiveTabIdx(idx) }}
                onDoubleClick={() => togglePined(idx)}
                onAuxClick={() => { removeTab(idx) }}
                defaultValue={pathToTabName(tab)}
                tabIndex={-1}
              >
                {pathToTabName(tab)}
              </Button>
            })
          }
          <Button
            css={[
              css({
                height: '20pt',
                minWidth: '5pt',
              }),
            ]}
            onClick={() => { addNewTab(tabAry.length - 1, tabAry[activeTabIdx].path) }}
            tabIndex={-1}
          >+</Button>
        </div >
        <MainPanel
          initPath={tabAry[activeTabIdx].path}
          pined={tabAry[activeTabIdx].pined}
          onPathChanged={onPathChanged}
          onItemNumChanged={props.onItemNumChanged}
          onSelectItemNumChanged={props.onSelectItemNumChanged}
          addNewTab={(path) => addNewTab(activeTabIdx, path)}
          removeTab={() => removeTab(activeTabIdx)}
          changeTab={changeTab}
          getOppositePath={props.getOppositePath}
          addLogMessage={props.addLogMessage}
          separator={props.separator}
          focusOppositePain={props.focusOppositePain}
          gridRef={props.gridRef}
          key={activeTabIdx}
        />
      </div>
    </>
  )
}
