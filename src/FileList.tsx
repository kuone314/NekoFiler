import { useEffect, useState } from 'react';
import { event, invoke } from '@tauri-apps/api';
import React from 'react';


/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'

import { FileNameColorSetting, readFileNameColorSetting } from './FileNameColorSetting';

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
const SORT_KEY = {
  name: "name",
  type: "type",
  size: "size",
  date: "date",
} as const;
type SortKey = typeof SORT_KEY[keyof typeof SORT_KEY];

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
  const [sortKey, setSortKey] = useState<SortKey>(SORT_KEY.name);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [initSelectItemHint, setInitSelectItemHint] = useState(props.initSelectItemHint);
  useEffect(() => {
    setInitSelectItemHint(props.initSelectItemHint);
  }, [props.initSelectItemHint]);
  useEffect(() => {
    setInitSelectItemHint("");
  }, [currentIndex]);

  const [entries, setEntries] = useState<Entries>(props.entries);
  useEffect(() => {
    const newEntries = [...props.entries];
    newEntries.sort((entry_1, entry_2) => {
      switch (sortKey) {
        case 'name': return entry_1.name > entry_2.name ? 1 : -1;
        case 'type': return ToTypeName(entry_1) > ToTypeName(entry_2) ? 1 : -1;
        case 'size': return entry_1.size > entry_2.size ? 1 : -1;
        case 'date': return entry_1.date > entry_2.date ? 1 : -1;
      }
    });

    const newIdxAry = [...selectingIndexArray]
      .map(idx => entries[idx].name)
      .map(name => newEntries.findIndex(entry => entry.name === name))
      .filter(idx => idx != -1);


    const selectTrg = (initSelectItemHint !== "")
      ? initSelectItemHint
      : currentItemName();
    const findResult = newEntries.findIndex(entry => entry.name === selectTrg);
    const newIndex = (() => {
      if (findResult !== -1) { return findResult; }
      if (currentIndex >= newEntries.length) {
        return Math.max(newEntries.length - 1, 0);
      }
      return currentIndex;
    })();

    setEntries(newEntries);
    setSelectingIndexArray(new Set([...newIdxAry]));
    setAdjustMargin(defaultAdjustMargin);
    setCurrentIndex(newIndex);
  }, [props.entries, sortKey, initSelectItemHint]);

  const currentItemName = () => {
    if (currentIndex < 0 || entries.length <= currentIndex) { return null; }
    return entries[currentIndex].name;
  }

  const [selectingIndexArray, setSelectingIndexArray] = useState<Set<number>>(new Set([]));
  const addSelectingIndexRange = (rangeTerm1: number, rangeTerm2: number) => {
    let new_ary = new Set([...selectingIndexArray, ...SequenceAry(rangeTerm1, rangeTerm2)]);
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

    setAdjustMargin(defaultAdjustMargin);
    setCurrentIndex(newIndex)
    setincremantalSearchingStr('')

    if (!select) { return }

    addSelectingIndexRange(currentIndex, newIndex);
  }

  const defaultAdjustMargin = 2;
  const [adjustMargin, setAdjustMargin] = useState(defaultAdjustMargin);
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
    const row_height = current_row_rect.height;

    const upside_just_pos = (diff - header_height);
    const upside_ajust_pos = upside_just_pos - adjustMargin * row_height;
    const outof_upside = (scroll_pos > upside_ajust_pos);
    if (outof_upside) {
      myGrid.current?.scrollTo({ top: upside_ajust_pos });
      return;
    }

    const downside_just_pos = (diff - scroll_area_height + row_height);
    const downside_ajust_pos = downside_just_pos + adjustMargin * row_height;
    const outof_downside = (downside_ajust_pos > scroll_pos);
    if (outof_downside) {
      myGrid.current?.scrollTo({ top: downside_ajust_pos });
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

    setAdjustMargin(defaultAdjustMargin);
    setCurrentIndex(idx)
    setincremantalSearchingStr(nextSearchStr)
  }

  interface MouseSelectInfo {
    startIndex: number,
    shiftKey: boolean,
    ctrlKey: boolean,
  }
  const [mouseSelectInfo, setMouseSelectInfo] = useState<MouseSelectInfo | null>(null);
  const onMouseDown = (row_idx: number, event: React.MouseEvent<Element>) => {
    if (event.buttons !== 1) { return; }
    setincremantalSearchingStr('');
    const info = {
      startIndex: row_idx,
      shiftKey: event.shiftKey,
      ctrlKey: event.ctrlKey,
    };
    setMouseSelectInfo(info);
    updateMouseSelection(info, row_idx);
  }
  const onMouseMove = (row_idx: number, event: React.MouseEvent<Element>) => {
    if (event.buttons !== 1) { return; }
    if (mouseSelectInfo === null) { return; }
    updateMouseSelection(mouseSelectInfo, row_idx);
  }
  const updateMouseSelection = (start: MouseSelectInfo, newIdx: number) => {
    if (start.shiftKey) {
      addSelectingIndexRange(currentIndex, newIdx); // for Shift+click
    } else if (start.ctrlKey) {
      addSelectingIndexRange(start.startIndex, newIdx);
    } else {
      setSelectingIndexArray(SequenceAry(start.startIndex, newIdx));
    }
    const isDrag = (start.startIndex !== newIdx);
    setAdjustMargin(isDrag ? 1 : 0);
    setCurrentIndex(newIdx);
  }
  const onMouseUp = (row_idx: number) => {
    setMouseSelectInfo(null);
    setAdjustMargin(0);
    setCurrentIndex(row_idx);
  }


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

    return rowIdxAry
      .filter(idx => 0 <= idx && idx < entries.length)
      .map(idx => entries[idx].name);
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
  const table_header_font = (sortType: SortKey) => {
    return css({
      fontWeight: (sortKey === sortType) ? 'bold' : 'normal',
    });
  }

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
        <th
          onClick={() => setSortKey(SORT_KEY.name)}
          css={[table_resizable, table_header_color, table_header_font(SORT_KEY.name),]}
        >FileName</th>
        <th
          onClick={() => setSortKey(SORT_KEY.type)}
          css={[table_resizable, table_header_color, table_header_font(SORT_KEY.type),]}
        >type</th>
        <th
          onClick={() => setSortKey(SORT_KEY.size)}
          css={[table_resizable, table_header_color, table_header_font(SORT_KEY.size),]}
        >size</th>
        <th
          onClick={() => setSortKey(SORT_KEY.date)}
          css={[table_resizable, table_header_color, table_header_font(SORT_KEY.date),]}
        >date</th>
      </tr>
    </thead>
    {
      entries.map((entry, idx) => {
        return <>
          <tr
            ref={(idx === currentIndex) ? current_row : null}
            onMouseDown={(event) => { onMouseDown(idx, event) }}
            onMouseMove={(event) => { onMouseMove(idx, event) }}
            onMouseUp={(event) => { onMouseUp(idx) }}
            onDoubleClick={(event) => onRowdoubleclick(idx, event)}
            css={table_color(idx)}
          >
            <td css={table_border}>{entry.name}</td>
            <td css={table_border}>{ToTypeName(entry)}</td>
            <td css={table_border}>{entry.is_dir ? '-' : entry.size}</td>
            <td css={table_border}>{entry.date}</td>
          </tr>
        </>
      })
    }
  </table>

  return [element, functions];
}

///////////////////////////////////////////////////////////////////////////////////////////////////
function SequenceAry(rangeTerm1: number, rangeTerm2: number) {
  const sttIdx = Math.min(rangeTerm1, rangeTerm2);
  const endIdx = Math.max(rangeTerm1, rangeTerm2);

  let new_ary = new Set<number>();
  for (let idx = sttIdx; idx <= endIdx; idx++) {
    new_ary.add(idx);
  }
  return new_ary;
}

function ToTypeName(entry: Entry) {
  return entry.is_dir
    ? 'folder'
    : entry.extension.length === 0
      ? '-'
      : entry.extension
}