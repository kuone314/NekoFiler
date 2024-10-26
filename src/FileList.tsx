import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import React from 'react';


/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'

import { FileListRowColorSettings, RowColorSetting, readFileListRowColorSetting } from './FileNameColorSetting';
import { IsValidIndex } from './Utility';
import { MatchImpl } from './Matcher';
import { ColorCodeString } from './ColorCodeString';
import { useTheme } from './ThemeStyle';
import { invoke } from '@tauri-apps/api/core';

///////////////////////////////////////////////////////////////////////////////////////////////////
export type FileListItem = {
  is_selected: boolean,
  file_name: string,
  file_extension: string,
  is_directory: boolean,
  file_icon: string | null,
  file_size: number | null,
  date: string | null,
}

export type FileListFilteredItem = {
  file_list_item: FileListItem,
  matched_idx_list: number[],
}

export type FileListUiInfo = {
  full_item_num: number,
  filtered_item_list: FileListFilteredItem[],
  focus_idx: number,
}

///////////////////////////////////////////////////////////////////////////////////////////////////
export interface IFileListItemFilter {
  IsMatch(entry: FileListItem): boolean;
  GetMatchingIdxAry(fileName: string): number[];
}

///////////////////////////////////////////////////////////////////////////////////////////////////
const SORT_KEY = {
  name: "name",
  type: "type",
  size: "size",
  date: "date",
} as const;

///////////////////////////////////////////////////////////////////////////////////////////////////
const defaultAdjustMargin = 2;

///////////////////////////////////////////////////////////////////////////////////////////////////
export interface FileListFunc {
  selectingItemName: () => string[],
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
  clearSelection: () => void,
  toggleSelection: () => void,
  selectCurrentOnly: () => void,
};

type FileListProps = {
  isActive: boolean,
  panel_idx: number,
  fileListInfo: FileListUiInfo,
  updateFileListInfo: (info: FileListUiInfo) => void,
  onSelectItemNumChanged: (newSelectItemNum: number) => void,
  accessParentDir: () => void,
  accessDirectry: (dirName: string) => void,
  accessFile: (fileName: string) => void,
  focusOppositePane: () => void,
  getOppositePath: () => void,
  gridRef?: React.RefObject<HTMLDivElement>,
};

export const FileList = forwardRef<FileListFunc, FileListProps>((props, ref) => {
  useImperativeHandle(ref, () => functions);

  const [colorSetting, setColorSetting] = useState<FileListRowColorSettings | null>(null);
  useEffect(() => {
    (async () => {
      const color_seting = await readFileListRowColorSetting();
      setColorSetting(color_seting);
    })()
  }, []);

  const [adjustMargin, setAdjustMargin] = useState(defaultAdjustMargin);

  useEffect(() => {
    adjustScroll();
  }, [props.fileListInfo.focus_idx]);

  const [mouseSelectInfo, setMouseSelectInfo] = useState<MouseSelectInfo | null>(null);

  const theme = useTheme();

  useEffect(() => {
    myGrid.current?.focus();
  }, []);

  const filteredEntries = props.fileListInfo.filtered_item_list;
  const currentIndex = props.fileListInfo.focus_idx;

  async function invokeSort(sortKey: string) {
    const payloadKey = (() => {
      switch (sortKey) {
        case 'name': return "Name";
        case 'type': return "FileType";
        case 'size': return "Size";
        case 'date': return "Date";
      }
    })();
    const paneInfo = await invoke<FileListUiInfo>('sort_file_list', {
      paneIdx: props.panel_idx,
      sortKey: payloadKey,
    });
    props.updateFileListInfo(paneInfo);
  }

  const addSelectingIndexRange = async (rangeTerm1: number, rangeTerm2: number) => {
    const paneInfo = await invoke<FileListUiInfo>("add_selecting_idx", {
      paneIdx: props.panel_idx,
      additionalSelectIdxList: SequenceAry(rangeTerm1, rangeTerm2),
    });
    props.updateFileListInfo(paneInfo);
  }

  const setCurrentIndex = async (newIndex: number) => {
    if (!IsValidIndex(filteredEntries, newIndex)) { return; }
    const paneInfo = await invoke<FileListUiInfo>("set_focus_idx", {
      paneIdx: props.panel_idx,
      newFocusIdx: newIndex,
    });
    props.updateFileListInfo(paneInfo);
  }

  const setupCurrentIndex = (newIndex: number, select: boolean) => {
    if (!IsValidIndex(filteredEntries, newIndex)) { return; }
    if (select) {
      addSelectingIndexRange(currentIndex, newIndex);
    }
    setCurrentIndex(newIndex);
    setAdjustMargin(defaultAdjustMargin);
  }

  const adjustScroll = () => {
    const scroll_pos = myGrid.current?.scrollTop;
    const scroll_area_height = myGrid.current?.clientHeight;
    const header_height = table_header.current?.clientHeight;
    const current_row_rect = current_row.current?.getBoundingClientRect();
    const table_full_size = current_row.current?.parentElement?.parentElement?.getBoundingClientRect();

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

  interface MouseSelectInfo {
    startIndex: number,
    shiftKey: boolean,
    ctrlKey: boolean,
  }
  const onMouseDown = (row_idx: number, event: React.MouseEvent<Element>) => {
    if (event.buttons !== 1) { return; }
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
    if (newIdx < filteredEntries.length) {
      const isDrag = (start.startIndex !== newIdx);
      setAdjustMargin(isDrag ? 1 : 0);
      setCurrentIndex(newIdx);
    }
  }
  const onMouseUp = (row_idx: number) => {
    setMouseSelectInfo(null);
    if (row_idx < filteredEntries.length) {
      setAdjustMargin(0);
      setCurrentIndex(row_idx);
    }
  }

  const onRowdoubleclick = (_row_idx: number, event: React.MouseEvent<Element>) => {
    accessCurrentItem()
    event.stopPropagation();
  };

  const accessCurrentItem = () => {
    if (!IsValidIndex(filteredEntries, currentIndex)) { return; }
    const entry = filteredEntries[currentIndex].file_list_item;
    if (entry.is_directory) {
      props.accessDirectry(entry.file_name);
    } else {
      props.accessFile(entry.file_name);
    }
  }

  const selectingItemName = () => {
    if (filteredEntries.length === 0) { return [''] }

    const result = filteredEntries
      .filter(item => item.file_list_item.is_selected)
      .map(item => item.file_list_item.file_name);

    return (result.length === 0)
      ? [filteredEntries[currentIndex].file_list_item.file_name]
      : result;
  }

  const moveUp = () => { setupCurrentIndex(currentIndex - 1, false) }
  const moveUpSelect = () => { setupCurrentIndex(currentIndex - 1, true) }
  const moveDown = () => { setupCurrentIndex(currentIndex + 1, false) }
  const moveDownSelect = () => { setupCurrentIndex(currentIndex + 1, true) }
  const moveTop = () => { setupCurrentIndex(0, false) }
  const moveTopSelect = () => { setupCurrentIndex(0, true) }
  const moveBottom = () => { setupCurrentIndex(filteredEntries.length - 1, false) }
  const moveBottomSelect = () => { setupCurrentIndex(filteredEntries.length - 1, true) }
  const selectAll = () => {
    const isSelectAll = filteredEntries.every(item => item.file_list_item.is_selected);
    if (isSelectAll) {
      clearSelection();
    } else {
      addSelectingIndexRange(0, filteredEntries.length - 1)
    }
  }
  const clearSelection = async () => {
    const paneInfo = await invoke<FileListUiInfo>("set_selecting_idx", {
      paneIdx: props.panel_idx,
      newSelectIdxList: [],
    });
    props.updateFileListInfo(paneInfo);
  }
  const toggleSelection = async () => {
    const paneInfo = await invoke<FileListUiInfo>("toggle_selection", {
      paneIdx: props.panel_idx,
      trgIdx: currentIndex,
    });
    props.updateFileListInfo(paneInfo);
  }
  const selectCurrentOnly = () => {
    setSelectingIndexArray([currentIndex]);
  }

  async function setSelectingIndexArray(newIdxList: Array<number>) {
    const paneInfo = await invoke<FileListUiInfo>("set_selecting_idx", {
      paneIdx: props.panel_idx,
      newSelectIdxList: newIdxList,
    });
    props.updateFileListInfo(paneInfo);
  }

  const myGrid = props.gridRef ?? React.createRef<HTMLDivElement>();
  const table_header = React.createRef<HTMLTableSectionElement>();
  const current_row = React.createRef<HTMLTableRowElement>();

  const table_color = (row_idx: number) => {
    if (colorSetting === null) { return css(); }

    const toTableColor = (setting: RowColorSetting) => {
      const evenRowBackGroune
        = ColorCodeString.new(setting.evenRowBackGroune)?.val
        ?? colorSetting.defaultColor.evenRowBackGroune;
      const oddRowBackGroune
        = ColorCodeString.new(setting.oddRowBackGroune)?.val
        ?? colorSetting.defaultColor.oddRowBackGroune;
      const forGround
        = ColorCodeString.new(setting.forGround)?.val
        ?? colorSetting.defaultColor.forGround;
      const activeHightlight
        = ColorCodeString.new(setting.activeHightlight)?.val
        ?? colorSetting.defaultColor.activeHightlight;

      const background = (row_idx % 2 == 0)
        ? evenRowBackGroune
        : oddRowBackGroune;

      return css({
        background: background,
        color: forGround,
        border: (props.isActive && row_idx === currentIndex)
          ? '3pt solid ' + activeHightlight
          : '1pt solid ' + background,
      });
    }

    const entry = filteredEntries[row_idx];
    const isSelectionColor = props.isActive && entry.file_list_item.is_selected;
    if (isSelectionColor) {
      return toTableColor(colorSetting.selectionColor);
    }

    const found = colorSetting.settings.find(setting => {
      if (setting.matcher.isDirectory !== entry.file_list_item.is_directory) { return false; }
      if (!MatchImpl(setting.matcher.nameMatcher, entry.file_list_item.file_name)) { return false; }
      return true;
    });
    if (found) {
      return toTableColor(found.color);
    }

    return toTableColor(colorSetting.defaultColor);
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
    border: '1pt solid ' + theme.stringDefaultColor,
  });

  const filteredItemNumInfo = () => {
    const filteredNum = (props.fileListInfo.full_item_num - filteredEntries.length);
    if (filteredNum === 0) { return '.' } // 余白を設けるため、空文字にはしない
    return filteredNum + ' file(s) filterd.'
  }

  function FileNameWithEmphasis(item: FileListFilteredItem): React.ReactNode {
    const file_name = item.file_list_item.file_name;
    const emphasisIdxAry = item.matched_idx_list;
    const charFlagPairs = file_name.split('').map((str, idx) => {
      const flag = emphasisIdxAry.includes(idx);
      return { str, flag };
    });

    const enphansisColor = (() => {
      if (!colorSetting) { return ``; }
      const found = colorSetting.settings.find(setting => {
        if (setting.matcher.isDirectory !== item.file_list_item.is_directory) { return false; }
        if (!MatchImpl(setting.matcher.nameMatcher, item.file_list_item.file_name)) { return false; }
        return true;
      });
      if (found) {
        return ColorCodeString.new(found.color.activeHightlight)?.val
          ?? colorSetting.defaultColor.activeHightlight;
      }
      return colorSetting.defaultColor.activeHightlight;
    })();

    return <>
      {charFlagPairs.map((pair, idx) => pair.flag
        ? <b style={{ color: enphansisColor }} key={idx}>{pair.str}</b>
        : <span key={idx}>{pair.str}</span>)}
    </>;
  }


  const functions = {
    selectingItemName: selectingItemName,
    accessCurrentItem,
    moveUp: moveUp,
    moveUpSelect: moveUpSelect,
    moveDown: moveDown,
    moveDownSelect: moveDownSelect,
    moveTop: moveTop,
    moveTopSelect: moveTopSelect,
    moveBottom: moveBottom,
    moveBottomSelect: moveBottomSelect,
    selectAll: selectAll,
    clearSelection: clearSelection,
    toggleSelection: toggleSelection,
    selectCurrentOnly,
  }

  return <div>
    <table
      css={
        {
          borderCollapse: 'collapse',
          resize: 'horizontal',
          height: 10, // table全体の最小サイズを指定。これが無いと、行数が少ない時に縦長になってしまう…。
          width: '95%',
          fontSize: '13px',
          lineHeight: '13pt'
        }
      }
    >
      <colgroup>
        <col css={{ width: '1px' }} />
      </colgroup>
      <thead css={[table_resizable, fix_table_header]} ref={table_header}>
        <tr>
          <th
            css={{ width: '10' }}
          />{/* icon */}
          <th
            onClick={() => invokeSort(SORT_KEY.name)}
            css={[table_resizable, table_header_color,]}
          >FileName</th>
          <th
            onClick={() => invokeSort(SORT_KEY.type)}
            css={[table_resizable, table_header_color,]}
          >type</th>
          <th
            onClick={() => invokeSort(SORT_KEY.size)}
            css={[table_resizable, table_header_color,]}
          >size</th>
          <th
            onClick={() => invokeSort(SORT_KEY.date)}
            css={[table_resizable, table_header_color,]}
          >date</th>
        </tr>
      </thead>
      {
        filteredEntries.map((item, idx) => {
          const entry = item.file_list_item;
          return <tbody key={'List' + idx}>
            <tr
              ref={(idx === currentIndex) ? current_row : null}
              onMouseDown={(event) => { onMouseDown(idx, event) }}
              onMouseMove={(event) => { onMouseMove(idx, event) }}
              onMouseUp={(_) => { onMouseUp(idx) }}
              onDoubleClick={(event) => onRowdoubleclick(idx, event)}
              css={table_color(idx)}
            >
              <td
                css={{ background: theme.backgroundColor }}
              >
                <img src={`data:image/bmp;base64,${entry.file_icon ?? ""}`} />
              </td>
              <td css={table_border}>{FileNameWithEmphasis(item)}</td>
              <td css={table_border}>{entry.file_extension}</td>
              <td css={table_border}>{entry.file_size ?? "-"}</td>
              <td css={table_border}>{entry.date}</td>
            </tr>
          </tbody>
        })
      }
    </table>
    <div
      style={{ height: 50, }}
      onMouseDown={(event) => { onMouseDown(filteredEntries.length, event) }}
      onMouseUp={(_) => { onMouseUp(filteredEntries.length) }}
      onMouseMove={(event) => { onMouseMove(filteredEntries.length, event) }}
    >{filteredItemNumInfo()} </div>
  </div >
});


///////////////////////////////////////////////////////////////////////////////////////////////////
function SequenceAry(rangeTerm1: number, rangeTerm2: number) {
  const sttIdx = Math.min(rangeTerm1, rangeTerm2);
  const endIdx = Math.max(rangeTerm1, rangeTerm2);

  let new_ary = new Array<number>();
  for (let idx = sttIdx; idx <= endIdx; idx++) {
    new_ary.push(idx);
  }
  return new_ary;
}
