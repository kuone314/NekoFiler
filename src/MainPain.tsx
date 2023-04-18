import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api';
import React from 'react';

import { Button } from '@mui/material';


import { executeShellCommand } from './RustFuncs';
import { separator, ApplySeparator } from './FilePathSeparator';
import { CommandInfo, COMMAND_TYPE, matchingKeyEvent, commandExecuter } from './CommandInfo';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'

import { MenuItem, ControlledMenu } from '@szhsin/react-menu';
import '@szhsin/react-menu/dist/index.css';
import '@szhsin/react-menu/dist/transitions/slide.css';

import useInterval from 'use-interval';

import JSON5 from 'json5'
import { color } from '@mui/system';

///////////////////////////////////////////////////////////////////////////////////////////////////
type Entry = {
  name: string,
  is_dir: boolean,
  extension: string,
  size: number,
  date: string,
};

type Entries = Array<Entry>;

///////////////////////////////////////////////////////////////////////////////////////////////////
export interface TabInfo {
  pathAry: string[],
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
  return JSON5.parse(result.toString()) as TabColorSetting[];
}

///////////////////////////////////////////////////////////////////////////////////////////////////
export const PaineTabs = (
  props: {
    pathAry: TabInfo,
    onTabsChanged: (newTabs: string[], newTabIdx: number,) => void,
    getOppositePath: () => string,
    separator: separator,
    focusOppositePain: () => void,
    gridRef?: React.RefObject<HTMLDivElement>,
  },
) => {
  const [tabAry, setTabAry] = useState<string[]>(props.pathAry.pathAry);
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
    newTabAry.splice(activeTabIdx + 1, 0, newTabPath);
    setTabAry(newTabAry);
  }
  const removeTab = () => {
    if (tabAry.length === 1) { return; }
    if (activeTabIdx >= tabAry.length) { return; }

    let newTabAry = Array.from(tabAry);
    newTabAry.splice(activeTabIdx, 1);
    setTabAry(newTabAry);

    if (activeTabIdx >= newTabAry.length) {
      setActiveTabIdx(newTabAry.length - 1);
    }
  }
  const changeTab = (offset: number) => {
    const new_val = (activeTabIdx + offset + tabAry.length) % tabAry.length;
    setActiveTabIdx(new_val);
  }

  const onPathChanged = (newPath: string) => {
    tabAry[activeTabIdx] = newPath
    setTabAry(Array.from(tabAry));
  }

  useEffect(() => {
    props.onTabsChanged(tabAry, activeTabIdx);
  }, [tabAry, activeTabIdx]);

  const pathToTabName = (pathStr: string) => {
    const splited = ApplySeparator(pathStr, '/').split('/').reverse();
    if (splited[0].length !== 0) { return splited[0]; }
    return splited[1];
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
            tabAry.map((path, idx) => {
              return <Button
                css={[
                  css({
                    textTransform: 'none',
                    border: (idx === activeTabIdx) ? '5px solid #ff0000' : '',
                  }),
                  tabColor(path),
                ]}
                onClick={() => { setActiveTabIdx(idx) }}
                defaultValue={pathToTabName(path)}
              >
                {pathToTabName(path)}
              </Button>
            })
          }
        </div >
        <MainPanel
          initPath={tabAry[activeTabIdx]}
          onPathChanged={onPathChanged}
          addNewTab={addNewTab}
          removeTab={removeTab}
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
  return JSON5.parse(result.toString()) as FileNameColorSetting[];
}

///////////////////////////////////////////////////////////////////////////////////////////////////
const MainPanel = (
  props: {
    initPath: string,
    onPathChanged: (newPath: string) => void
    addNewTab: (newTabPath: string) => void,
    removeTab: () => void,
    changeTab: (offset: number) => void,
    getOppositePath: () => string,
    separator: separator,
    focusOppositePain: () => void,
    gridRef?: React.RefObject<HTMLDivElement>,
  }
) => {
  const [addressbatStr, setAddressbatStr] = useState<string>("");
  const [dir, setDir] = useState<string>(props.initPath);
  const [entries, setEntries] = useState<Entries>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [selectingIndexArray, setSelectingIndexArray] = useState<Set<number>>(new Set([]));
  const addSelectingIndexRange = (rangeTerm1: number, rangeTerm2: number) => {
    const sttIdx = Math.min(rangeTerm1, rangeTerm2);
    const endIdx = Math.max(rangeTerm1, rangeTerm2);

    let new_ary = new Set([...selectingIndexArray]);
    for (let idx = sttIdx; idx <= endIdx; idx++) {
      new_ary.add(idx);
    }
    setSelectingIndexArray(new_ary);
  }

  const [colorSetting, setColorSetting] = useState<FileNameColorSetting[]>([]);
  useEffect(() => {
    (async () => {
      const color_seting = await readFileNameColorSetting();
      setColorSetting(color_seting);
    })()
  }, []);

  const accessDirectry = async (path: string) => {
    const adjusted = await invoke<AdjustedAddressbarStr>("adjust_addressbar_str", { str: path });
    setDir(adjusted.dir);
  }


  const UpdateList = async (dir: string) => {
    const newEntries = await invoke<Entries>("get_entries", { path: dir })
      .catch(err => {
        console.error(err);
        return null;
      });

    if (!newEntries) { return; }
    if (JSON.stringify(newEntries) === JSON.stringify(entries)) {
      return;
    }
    setEntries(newEntries);
  }

  useEffect(() => {
    setAddressbatStr(ApplySeparator(addressbatStr, props.separator));
  }, [props.separator]);

  useEffect(() => {
    UpdateList(dir);
    setCurrentIndex(0);
    setSelectingIndexArray(new Set([]));
    setAddressbatStr(ApplySeparator(dir, props.separator));
    props.onPathChanged(dir);
  }, [dir]);

  useEffect(() => {
    myGrid.current?.focus();
  }, []);

  useInterval(
    () => UpdateList(dir),
    1500
  );

  const setupCurrentIndex = (newIndex: number, select: boolean) => {
    if (currentIndex === newIndex) { return; }
    if (newIndex < 0) { return; }
    if (newIndex >= entries.length) { return; }

    setCurrentIndex(newIndex)
    setincremantalSearchingStr('')

    if (!select) { return }

    addSelectingIndexRange(currentIndex, newIndex);
  }

  const adjustScroll = () => {
    const scroll_pos = myGrid.current?.scrollTop;
    const scroll_area_height = myGrid.current?.clientHeight;
    const header_height = table_header.current?.clientHeight;
    const current_row_rect = current_row.current?.getBoundingClientRect();
    const table_full_size = current_row.current?.parentElement?.getBoundingClientRect();

    if (scroll_pos == undefined) { return; }
    if (scroll_area_height == undefined) { return; }
    if (header_height == undefined) { return; }
    if (current_row_rect == undefined) { return; }
    if (table_full_size == undefined) { return; }

    const diff = current_row_rect.y - table_full_size.y;

    const upside_just_pos = (diff - header_height);
    const outof_upside = (scroll_pos > upside_just_pos);
    if (outof_upside) {
      myGrid.current?.scrollTo({ top: upside_just_pos });
      return;
    }

    const downside_just_pos = (diff - scroll_area_height + current_row_rect.height);
    const outof_downside = (downside_just_pos > scroll_pos);
    if (outof_downside) {
      myGrid.current?.scrollTo({ top: downside_just_pos });
      return;
    }
  }
  useEffect(() => {
    adjustScroll();
  }, [currentIndex]);

  const [incremantalSearchingStr, setincremantalSearchingStr] = useState('');
  const incremantalSearch = (key: string) => {
    const nextSearchStr = incremantalSearchingStr + key;
    const idx = entries.findIndex((entry) => {
      return entry.name.toLowerCase().startsWith(nextSearchStr)
    })
    if (idx === -1) { return }

    setCurrentIndex(idx)
    setincremantalSearchingStr(nextSearchStr)
  }

  const onRowclick = (row_idx: number, event: React.MouseEvent<Element>) => {
    if (event.shiftKey) {
      addSelectingIndexRange(currentIndex, row_idx);
    } else if (event.ctrlKey) {
      addSelectingIndexRange(row_idx, row_idx);
    } else {
      setSelectingIndexArray(new Set([row_idx]));
    }
    setCurrentIndex(row_idx);
    setincremantalSearchingStr('')
    myGrid.current?.focus()
  };

  const onRowdoubleclick = (row_idx: number, event: React.MouseEvent<Element>) => {
    accessItemByIdx(row_idx);
    event.stopPropagation();
  };

  const accessItemByIdx = async (rowIdx: number) => {
    const entry = entries[rowIdx];
    if (entry.is_dir) {
      accessDirectry(dir + props.separator + entry.name);
    } else {
      const decoretedPath = '&"./' + entry.name + '"';
      executeShellCommand(decoretedPath, dir);
    }
  }
  const accessCurrentItem = () => {
    accessItemByIdx(currentIndex);
  }

  const selectingItemName = () => {
    if (entries.length === 0) { return [''] }

    let rowIdxAry = [...selectingIndexArray]
    if (rowIdxAry.length === 0) { rowIdxAry = [currentIndex]; }

    return rowIdxAry.map(idx => entries[idx].name);
  }

  const moveUp = () => { setupCurrentIndex(currentIndex - 1, false) }
  const moveUpSelect = () => { setupCurrentIndex(currentIndex - 1, true) }
  const moveDown = () => { setupCurrentIndex(currentIndex + 1, false) }
  const moveDownSelect = () => { setupCurrentIndex(currentIndex + 1, true) }
  const moveTop = () => { setupCurrentIndex(0, false) }
  const moveTopSelect = () => { setupCurrentIndex(0, true) }
  const moveBottom = () => { setupCurrentIndex(entries.length - 1, false) }
  const moveBottomSelect = () => { setupCurrentIndex(entries.length - 1, true) }
  const toggleSelection = () => {
    let new_ary = new Set([...selectingIndexArray]);
    if (selectingIndexArray.has(currentIndex)) {
      new_ary.delete(currentIndex);
    } else {
      new_ary.add(currentIndex);
    }
    setSelectingIndexArray(new_ary)
  }
  const addNewTab = () => { props.addNewTab(dir); }
  const removeTab = () => { props.removeTab(); }
  const toPrevTab = () => { props.changeTab(-1); }
  const toNextTab = () => { props.changeTab(+1); }
  const focusAddoressBar = () => { addressBar.current?.focus(); }

  const execBuildInCommand = (commandName: string) => {
    switch (commandName) {
      case 'accessCurrentItem': accessCurrentItem(); return;
      case 'accessParentDir': accessParentDir(); return;
      case 'moveUp': moveUp(); return;
      case 'moveUpSelect': moveUpSelect(); return;
      case 'moveDown': moveDown(); return;
      case 'moveDownSelect': moveDownSelect(); return;
      case 'moveTop': moveTop(); return;
      case 'moveTopSelect': moveTopSelect(); return;
      case 'moveBottom': moveBottom(); return;
      case 'moveBottomSelect': moveBottomSelect(); return;
      case 'toggleSelection': toggleSelection(); return;
      case 'addNewTab': addNewTab(); return;
      case 'removeTab': removeTab(); return;
      case 'toPrevTab': toPrevTab(); return;
      case 'toNextTab': toNextTab(); return;
      case 'focusAddoressBar': focusAddoressBar(); return;
      case 'focusOppositePain': props.focusOppositePain(); return;
    }
  }

  const execCommand = (command: CommandInfo) => {
    if (command.action.type === COMMAND_TYPE.build_in) {
      execBuildInCommand(command.action.command);
      return
    }

    if (command.action.type === COMMAND_TYPE.power_shell) {
      execShellCommand(command, dir, selectingItemName(), props.getOppositePath(), props.separator);
      return
    }
  }
  const handlekeyboardnavigation = (keyboard_event: React.KeyboardEvent<HTMLDivElement>) => {
    keyboard_event.preventDefault();
    (async () => {
      const command_ary = await matchingKeyEvent(keyboard_event);
      if (command_ary.length === 1) {
        execCommand(command_ary[0])
        return;
      }

      if (command_ary.length >= 2) {
        menuItemAry.current = command_ary;
        setMenuOpen(true);
        return;
      }

      if (keyboard_event.key.length === 1) {
        incremantalSearch(keyboard_event.key)
        return;
      }
    })();
  };

  const addressBar = React.createRef<HTMLInputElement>();

  type AdjustedAddressbarStr = {
    dir: string,
  };

  const accessParentDir = async () => {
    accessDirectry(addressbatStr + props.separator + '..')
  };

  const onEnterDown = async () => {
    accessDirectry(addressbatStr)
    myGrid.current?.focus();
  }
  const onEscapeDown = () => {
    myGrid.current?.focus();
  }
  const onKeyDown = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') { onEnterDown(); return; }
    if (event.key === 'Escape') { onEscapeDown(); return; }
  };

  const onDoubleClick = () => {
    accessParentDir();
  }

  const myGrid = props.gridRef ?? React.createRef<HTMLDivElement>();
  const table_header = React.createRef<HTMLTableSectionElement>();
  const current_row = React.createRef<HTMLTableRowElement>();

  const [dialog, execShellCommand] = commandExecuter(
    () => { myGrid.current?.focus() },
  );

  const [isMenuOpen, setMenuOpen] = useState(false);
  const menuItemAry = useRef<CommandInfo[]>([]);
  const commandSelectMenu = () => {
    return <ControlledMenu
      state={isMenuOpen ? 'open' : 'closed'}
      onClose={() => setMenuOpen(false)}
      anchorPoint={{ x: 400, y: 1000 }} // 適当…。
    >
      {
        menuItemAry.current.map(command => {
          return <MenuItem
            onClick={e => execCommand(command)}
          >
            {command.command_name}
          </MenuItem>
        })
      }
    </ControlledMenu>
  }

  const table_color = (row_idx: number) => {
    const backgroundColor = () => {
      return (selectingIndexArray.has(row_idx)) ? '#0090ff'
        : (row_idx % 2) ? '#dddddd' : '#ffffff';
    }

    const stringColor = () => {
      try {
        const entry = entries[row_idx];
        const found = colorSetting.find(setting => {
          if (setting.matching.isDirectory !== entry.is_dir) { return false; }
          const regExp = new RegExp(setting.matching.fileNameRegExp);
          if (!regExp.test(entry.name)) { return false; }
          return true;
        });
        return found?.color ?? '';
      } catch {
        return '';
      }
    }

    return css({
      background: backgroundColor(),
      color: stringColor(),
      border: (row_idx === currentIndex) ? '3pt solid #880000' : '1pt solid #000000',
    });
  }
  const table_border = css({
    border: '1pt solid #000000',
  });

  const table_resizable = css({
    resize: 'horizontal',
    overflow: 'hidden',
  });
  const fix_table_header = css({
    position: 'sticky',
    top: '0',
    left: '0',
  });
  const table_header_color = css({
    background: '#f2f2f2',
    border: '1pt solid #000000',
  });

  const merginForDoubleClick = () => {
    return <div style={{ height: 50, }}>. </div>
  }

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
        <input
          type="text"
          value={addressbatStr}
          onChange={e => setAddressbatStr(e.target.value)}
          onKeyDown={onKeyDown}
          ref={addressBar}
        />
        <div
          css={css([{ display: 'grid', overflow: 'auto' }])}
          onDoubleClick={onDoubleClick}
          onKeyDown={handlekeyboardnavigation}
          tabIndex={0}
          ref={myGrid}
        >
          <table
            css={
              {
                borderCollapse: 'collapse',
                resize: 'horizontal',
                height: 10, // table全体の最小サイズを指定。これが無いと、行数が少ない時に縦長になってしまう…。
                width: '95%',
                userSelect: 'none',
                fontSize: '13px',
                lineHeight: '13pt'
              }
            }
          >
            <thead css={[table_resizable, fix_table_header]} ref={table_header}>
              <tr>
                <th css={[table_resizable, table_header_color]}>FIleName</th>
                <th css={[table_resizable, table_header_color]}>type</th>
                <th css={[table_resizable, table_header_color]}>size</th>
                <th css={[table_resizable, table_header_color]}>date</th>
              </tr>
            </thead>
            {
              entries.map((entry, idx) => {
                return <>
                  <tr
                    ref={(idx === currentIndex) ? current_row : null}
                    onClick={(event) => onRowclick(idx, event)}
                    onDoubleClick={(event) => onRowdoubleclick(idx, event)}
                    css={table_color(idx)}
                  >
                    <td css={table_border}>{entry.name}</td>
                    <td css={table_border}>{entry.is_dir ? 'folder' : entry.extension.length === 0 ? '-' : entry.extension}</td>
                    <td css={table_border}>{entry.is_dir ? '-' : entry.size}</td>
                    <td css={table_border}>{entry.date}</td>
                  </tr>
                </>
              })
            }
          </table>
          {merginForDoubleClick()}
        </div>
      </div>
      {dialog}
      {commandSelectMenu()}
    </>
  );
}
