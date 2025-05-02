import React, { useState } from 'react';

import { Button } from '@mui/material';


import { separator } from './FilePathSeparator';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'

import { TabColor, TabColorSettings } from './TabColorSetting';

import { MainPanel } from './MainPane';
import { TabInfo, TabsInfo } from './TabsInfo';
import { ControlledMenu, MenuItem } from '@szhsin/react-menu';
import { Sequence } from './Utility';
import { LogInfo } from './LogMessagePane';
import { ButtonStyle, MenuitemStyle, useTheme } from './ThemeStyle';
import { BsFillPinFill } from "react-icons/bs";
import { TabName, TabNameSettings } from './TabNameSetting';

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
    isActive: boolean,
    panel_idx: number,
    height: number,
    pathAry: TabsInfo,
    tabColorSetting?: TabColorSettings
    tabNameSettings?: TabNameSettings,
    onTabsChanged: (newTabs: TabInfo[], newTabIdx: number,) => void,
    onItemNumChanged: (newItemNum: number) => void,
    onSelectItemNumChanged: (newSelectItemNum: number) => void,
    getOppositePath: () => string,
    addLogMessage: (message: LogInfo) => void,
    setTabColor: (trgDir: string) => void,
    setTabName: (trgDir: string) => void,
    separator: separator,
    focusOppositePane: () => void,
    focusCommandBar: () => void,
    gridRef?: React.RefObject<HTMLDivElement>,
    setKeyBind: (trgKey: React.KeyboardEvent<HTMLDivElement> | null) => void,
    duplicateTabToOppositePane: () => void,
  },
) => {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [contextMenuTabIdx, setContextMenuTabIdx] = useState(0);
  const [contextMenuPosX, setContextMenuPosX] = useState(0);
  const [contextMenuPosY, setContextMenuPosY] = useState(0);

  const theme = useTheme();
  const menuItemStyle = MenuitemStyle(theme.baseColor);

  const tabAry = props.pathAry.pathAry;
  const activeTabIdx = props.pathAry.activeTabIndex;

  const addNewTab = (addPosIdx: number, newTabPath: string) => {
    let newTabAry = Array.from(props.pathAry.pathAry);
    newTabAry.splice(addPosIdx + 1, 0, { path: newTabPath, pined: false });
    props.onTabsChanged(newTabAry, addPosIdx + 1);
  }
  const removeTab = (trgIdx: number) => {
    const remainTabList = Sequence(0, tabAry.length).filter(idx => idx != trgIdx)
    removeTabs(remainTabList);
  }

  const removeTabs = (remainIdxAry: number[]) => {
    const pinedIdxList = Sequence(0, tabAry.length).filter(idx => tabAry[idx].pined);
    const actualRemainIdxAry = [...new Set(remainIdxAry.concat(pinedIdxList))].sort();
    if (actualRemainIdxAry.length === 0) { return; }

    let newTabAry = actualRemainIdxAry.map(idx => tabAry[idx]);
    const newTabIdx = actualRemainIdxAry
      .map((orgIdx, idx) => { return { idx, dist: Math.abs(orgIdx - activeTabIdx) } })
      .reduce((pre, cur) => (pre.dist < cur.dist) ? pre : cur)
      .idx;
    props.onTabsChanged(newTabAry, newTabIdx);
  }

  const removeOtherTabs = (remainIdx: number) => {
    const remainTabList = [remainIdx];
    removeTabs(remainTabList);
  }

  const removeAllRightTabs = (baseIdx: number) => {
    const remainTabList = Sequence(0, baseIdx + 1);
    removeTabs(remainTabList);
  }

  const removeAllLeftTabs = (baseIdx: number) => {
    const remainTabList = Sequence(baseIdx, tabAry.length - baseIdx);
    removeTabs(remainTabList);
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
    if (tabAry[activeTabIdx].path === newPath) { return; }

    const newTabAry = structuredClone(tabAry);
    newTabAry[activeTabIdx].path = newPath
    props.onTabsChanged(newTabAry, activeTabIdx);
  }

  const contextMenu = () => {
    return <ControlledMenu
      state={isMenuOpen ? 'open' : 'closed'}
      onClose={() => { setMenuOpen(false); }}
      anchorPoint={{ x: contextMenuPosX, y: contextMenuPosY }} // 適当…。
    >
      <MenuItem
        css={menuItemStyle}
        onClick={_ => removeAllRightTabs(contextMenuTabIdx)}
      >
        Close Right Tabs
      </MenuItem>
      <MenuItem
        css={menuItemStyle}
        onClick={_ => removeAllLeftTabs(contextMenuTabIdx)}
      >
        Close Left Tabs
      </MenuItem>
      <MenuItem
        css={menuItemStyle}
        onClick={_ => removeOtherTabs(contextMenuTabIdx)}
      >
        Close All Other Tabs
      </MenuItem>
      <MenuItem
        css={menuItemStyle}
        onClick={_ => removeTab(contextMenuTabIdx)}
      >
        Close Tab
      </MenuItem>
      <MenuItem
        css={menuItemStyle}
        onClick={_ => props.setTabColor(tabAry[contextMenuTabIdx].path)}
      >
        Set Tab Color
      </MenuItem>
      <MenuItem
        css={menuItemStyle}
        onClick={_ => props.setTabName(tabAry[contextMenuTabIdx].path)}
      >
        Set Tab Name
      </MenuItem>
      <MenuItem
        css={menuItemStyle}
        onClick={_ => togglePined(contextMenuTabIdx)}
      >
        Toggle Pin
      </MenuItem>
    </ControlledMenu>
  }

  const buttonStyle = ButtonStyle(theme.baseColor);

  return (
    <>
      {contextMenu()}
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
                  css(
                    buttonStyle,
                    {
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
                onAuxClick={e => { if (e.button === 1) { removeTab(idx) } }}
                onContextMenu={e => {
                  setContextMenuTabIdx(idx);
                  setContextMenuPosX(e.clientX);
                  setContextMenuPosY(e.clientY);
                  setMenuOpen(true);
                  e.preventDefault();
                }}
                defaultValue={TabName(props.tabNameSettings, tab.path)}
                tabIndex={-1}
                key={'TabButton' + idx}
              >
                {tab.pined ? <BsFillPinFill style={{ marginRight: '6px' }} /> : <></>}
                {TabName(props.tabNameSettings, tab.path)}
              </Button>
            })
          }
          <Button
            css={[
              css(
                buttonStyle,
                {
                  height: '20pt',
                  minWidth: '5pt',
                }),
            ]}
            onClick={() => { addNewTab(tabAry.length - 1, tabAry[activeTabIdx].path) }}
            tabIndex={-1}
          >+</Button>
        </div >
        <MainPanel
          isActive={props.isActive}
          panel_idx={props.panel_idx}
          dirPath={tabAry[activeTabIdx].path}
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
          focusCommandBar={props.focusCommandBar}
          gridRef={props.gridRef}
          key={activeTabIdx}
          setKeyBind={props.setKeyBind}
          duplicateTabToOppositePane={props.duplicateTabToOppositePane}
        />
      </div>
    </>
  )
}
