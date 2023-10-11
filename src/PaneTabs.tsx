import React from 'react';

import { Button } from '@mui/material';


import { separator, ApplySeparator } from './FilePathSeparator';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'

import { TabColor, TabColorSetting } from './TabColorSetting';

import { MainPanel } from './MainPane';
import { TabInfo, TabsInfo } from './TabsInfo';


///////////////////////////////////////////////////////////////////////////////////////////////////
export interface TabFuncs {
  addNewTab: (newTabPath: string) => void,
  removeTab: () => void,
  removeOtherTabs: () => void,
  removeAllRightTabs: () => void,
  removeAllLeftTabs: () => void,
  changeTab: (offset: number) => void,
}

///////////////////////////////////////////////////////////////////////////////////////////////////
export const PaneTabs = (
  props: {
    height: number,
    pathAry: TabsInfo,
    tabColorSetting: TabColorSetting[]
    onTabsChanged: (newTabs: TabInfo[], newTabIdx: number,) => void,
    onItemNumChanged: (newItemNum: number) => void,
    onSelectItemNumChanged: (newSelectItemNum: number) => void,
    getOppositePath: () => string,
    addLogMessage: (message: string) => void,
    separator: separator,
    focusOppositePane: () => void,
    gridRef?: React.RefObject<HTMLDivElement>,
  },
) => {
  const tabAry = props.pathAry.pathAry;
  const activeTabIdx = props.pathAry.activeTabIndex;

  const addNewTab = (addPosIdx: number, newTabPath: string) => {
    let newTabAry = Array.from(props.pathAry.pathAry);
    newTabAry.splice(addPosIdx + 1, 0, { path: newTabPath, pined: false });
    props.onTabsChanged(newTabAry, addPosIdx + 1);
  }
  const removeTab = (trgIdx: number) => {
    if (tabAry.length === 1) { return; }
    if (trgIdx >= tabAry.length) { return; }
    if (tabAry[trgIdx].pined) { return; }

    let newTabAry = Array.from(tabAry);
    newTabAry.splice(trgIdx, 1);

    const newTabIdx = (activeTabIdx >= newTabAry.length) ? newTabAry.length - 1 : activeTabIdx;
    props.onTabsChanged(newTabAry, newTabIdx);
  }

  const removeOtherTabs = (remainIdx: number) => {
    let newTabAry = tabAry.filter((tab, idx) => tab.pined || idx === remainIdx);
    if (newTabAry.length === 0) { return; }
    const newTabIdx = tabAry.slice(0, remainIdx).filter(tab => tab.pined).length;
    props.onTabsChanged(newTabAry, newTabIdx);
  }

  const removeAllRightTabs = (baseIdx: number) => {
    let newTabAry = tabAry.filter((tab, idx) => tab.pined || idx <= baseIdx);
    if (newTabAry.length === 0) { return; }
    props.onTabsChanged(newTabAry, activeTabIdx);
  }

  const removeAllLeftTabs = (baseIdx: number) => {
    let newTabAry = tabAry.filter((tab, idx) => tab.pined || idx >= baseIdx);
    if (newTabAry.length === 0) { return; }
    const newTabIdx = tabAry.slice(0, baseIdx).filter(tab => tab.pined).length;
    props.onTabsChanged(newTabAry, newTabIdx);
  }

  const changeTab = (offset: number) => {
    const new_val = (activeTabIdx + offset + tabAry.length) % tabAry.length;
    props.onTabsChanged(tabAry, new_val);
  }
  const togglePined = (idx: number) => {
    let newTabAry = Array.from(tabAry);
    newTabAry[idx].pined = !newTabAry[idx].pined;
    props.onTabsChanged(newTabAry, activeTabIdx);
  }

  const onPathChanged = (newPath: string) => {
    tabAry[activeTabIdx].path = newPath
    props.onTabsChanged(Array.from(tabAry), activeTabIdx);
  }


  const pathToTabName = (tab: TabInfo) => {
    const pinedPrefix = tab.pined ? "*:" : "";
    const dirName = (() => {
      const splited = ApplySeparator(tab.path, '/').split('/').reverse();
      if (splited[0].length !== 0) { return splited[0]; }
      return splited[1];
    })();
    return pinedPrefix + dirName;
  }

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
            props.pathAry.pathAry.map((tab, idx) => {
              return <Button
                css={[
                  css({
                    textTransform: 'none',
                    fontSize: '10pt',
                    height: '20pt',
                    margin: '1pt',
                    minWidth: '5pt'
                  }),
                  TabColor(
                    props.tabColorSetting,
                    5,
                    idx === props.pathAry.activeTabIndex,
                    tab.path),
                ]}
                onClick={() => { props.onTabsChanged(tabAry, idx) }}
                onDoubleClick={() => togglePined(idx)}
                onAuxClick={() => { removeTab(idx) }}
                defaultValue={pathToTabName(tab)}
                tabIndex={-1}
                key={'TabButton' + idx}
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
          tabFuncs={
            {
              addNewTab: (path: string) => addNewTab(activeTabIdx, path),
              removeTab: () => removeTab(activeTabIdx),
              removeOtherTabs: () => removeOtherTabs(activeTabIdx),
              removeAllRightTabs: () => removeAllRightTabs(activeTabIdx),
              removeAllLeftTabs: () => removeAllLeftTabs(activeTabIdx),
              changeTab,
            }
          }
          getOppositePath={props.getOppositePath}
          addLogMessage={props.addLogMessage}
          separator={props.separator}
          focusOppositePane={props.focusOppositePane}
          gridRef={props.gridRef}
          key={activeTabIdx}
        />
      </div>
    </>
  )
}
