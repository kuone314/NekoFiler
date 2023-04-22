import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api';
import React from 'react';

import { Button } from '@mui/material';


import { separator, ApplySeparator } from './FilePathSeparator';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'

import '@szhsin/react-menu/dist/index.css';
import '@szhsin/react-menu/dist/transitions/slide.css';


import JSON5 from 'json5'

import {MainPanel} from './MainPain';

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
interface TabColorSetting {
  color: {
    backGround: string,
    string: string,
  },
  pathRegExp: string,
}

async function readTabColorSetting(): Promise<TabColorSetting[]> {
  const result = await invoke<String>("read_setting_file", { filename: 'tab_color.json5' });
  const read = JSON5.parse(result.toString()) as { version: number, data: TabColorSetting[] };
  return read.data;
}

///////////////////////////////////////////////////////////////////////////////////////////////////
export const PaineTabs = (
  props: {
    pathAry: TabsInfo,
    onTabsChanged: (newTabs: TabInfo[], newTabIdx: number,) => void,
    getOppositePath: () => string,
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

  const addNewTab = (newTabPath: string) => {
    let newTabAry = Array.from(tabAry);
    newTabAry.splice(activeTabIdx + 1, 0, { path: newTabPath, pined: false });
    setTabAry(newTabAry);
    setActiveTabIdx(activeTabIdx + 1);
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
        const pathRegExp = new RegExp(setting.pathRegExp);
        const path_ary = [
          ApplySeparator(path, '/'),
          ApplySeparator(path, '\\'),
        ];
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
          height: '100%',
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
              >
                {pathToTabName(tab)}
              </Button>
            })
          }
        </div >
        <MainPanel
          initPath={tabAry[activeTabIdx].path}
          pined={tabAry[activeTabIdx].pined}
          onPathChanged={onPathChanged}
          addNewTab={addNewTab}
          removeTab={() => removeTab(activeTabIdx)}
          changeTab={changeTab}
          getOppositePath={props.getOppositePath}
          separator={props.separator}
          focusOppositePain={props.focusOppositePain}
          gridRef={props.gridRef}
          key={activeTabIdx}
        />
      </div>
    </>
  )
}

///////////////////////////////////////////////////////////////////////////////////////////////////
interface FileNameColorSetting {
  color: string,
  matching: {
    isDirectory: boolean,
    fileNameRegExp: string,
  },
}

async function readFileNameColorSetting(): Promise<FileNameColorSetting[]> {
  const result = await invoke<String>("read_setting_file", { filename: 'file_name_color.json5' });
  const read = JSON5.parse(result.toString()) as { version: number, data: FileNameColorSetting[] };
  return read.data;
}
