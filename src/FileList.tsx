import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api';
import React from 'react';



import { executeShellCommand } from './RustFuncs';
import { separator, ApplySeparator } from './FilePathSeparator';
import { CommandInfo, COMMAND_TYPE, commandExecuter } from './CommandInfo';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'

import { MenuItem, ControlledMenu } from '@szhsin/react-menu';
import '@szhsin/react-menu/dist/index.css';
import '@szhsin/react-menu/dist/transitions/slide.css';

import useInterval from 'use-interval';

import JSON5 from 'json5'
import { basename, normalize } from '@tauri-apps/api/path';

///////////////////////////////////////////////////////////////////////////////////////////////////
export type Entry = {
  name: string,
  is_dir: boolean,
  extension: string,
  size: number,
  date: string,
};

export type Entries = Array<Entry>;

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

///////////////////////////////////////////////////////////////////////////////////////////////////
export interface FileListFunc {
  selectingItemName: () => string[],
  incremantalSearch: (searchStr: string) => void,
  accessCurrentItem: () => void,
  moveUp: () => void,
  moveUpSelect: () => void,
  moveDown: () => void,
  moveDownSelect: () => void,
  moveTop: () => void,
  moveTopSelect: () => void,
  moveBottom: () => void,
  moveBottomSelect: () => void,
  selectAll: () => void,
  toggleSelection: () => void,
};

export function FileList(
  props: {
    entries: Entries,
    initSelectItemHint: string,
    accessParentDir: () => void,
    accessDirectry: (dirName: string) => void,
    accessFile: (fileName: string) => void,
    focusOppositePain: () => void,
    getOppositePath: () => void,
    gridRef?: React.RefObject<HTMLDivElement>,
  }
): [JSX.Element, FileListFunc,] {
  const [currentIndex, setCurrentIndex] = useState(0);

  const [initSelectItemHint, setInitSelectItemHint] = useState(props.initSelectItemHint);
  useEffect(() => {
    setInitSelectItemHint(props.initSelectItemHint);
  }, [props.initSelectItemHint]);

  const [entries, setEntries] = useState<Entries>(props.entries);
  useEffect(() => {
    setEntries(props.entries);
  }, [props.entries]);

  useEffect(() => {
    const findRes = entries.findIndex(entry => entry.name === initSelectItemHint);
    if (findRes !== -1) { setCurrentIndex(findRes); }
  }, [entries, initSelectItemHint]);

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



  useEffect(() => {
    myGrid.current?.focus();
  }, []);


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
      props.accessDirectry(entry.name);
    } else {
      props.accessFile(entry.name);
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
  const selectAll = () => {
    const isSelectAll = (selectingIndexArray.size === entries.length);
    if (isSelectAll) {
      setSelectingIndexArray(new Set());
    } else {
      addSelectingIndexRange(0, entries.length - 1)
    }
  }
  const toggleSelection = () => {
    let new_ary = new Set([...selectingIndexArray]);
    if (selectingIndexArray.has(currentIndex)) {
      new_ary.delete(currentIndex);
    } else {
      new_ary.add(currentIndex);
    }
    setSelectingIndexArray(new_ary)
  }


  const myGrid = props.gridRef ?? React.createRef<HTMLDivElement>();
  const table_header = React.createRef<HTMLTableSectionElement>();
  const current_row = React.createRef<HTMLTableRowElement>();

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

  const functions = {
    selectingItemName: selectingItemName,
    incremantalSearch: incremantalSearch,
    accessCurrentItem: accessCurrentItem,
    moveUp: moveUp,
    moveUpSelect: moveUpSelect,
    moveDown: moveDown,
    moveDownSelect: moveDownSelect,
    moveTop: moveTop,
    moveTopSelect: moveTopSelect,
    moveBottom: moveBottom,
    moveBottomSelect: moveBottomSelect,
    selectAll: selectAll,
    toggleSelection: toggleSelection,
  }

  const element = <table
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

  return [element, functions];
}
