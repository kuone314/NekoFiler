import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import React from 'react';


/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'

import { FileListRowColorSettings, RowColorSetting, readFileListRowColorSetting } from './FileNameColorSetting';
import { IsValidIndex, LastIndex } from './Utility';
import { MatchImpl } from './Matcher';
import { ColorCodeString } from './ColorCodeString';
import { useTheme } from './ThemeStyle';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api';
import { PaneInfo } from './MainPane';

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

export type FileListInfo = {
  item_list: FileListItem[],
}

///////////////////////////////////////////////////////////////////////////////////////////////////
export interface IFileListItemFilter {
  IsMatch(entry: FileListItem): boolean;
  GetMatchingIdxAry(fileName: string): number[];
}

type FilteredFileListItem = {
  item: FileListItem,
  org_idx: number,
}

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
  dirctoryPath: string,
  fileListInfo: FileListItem[],
  updateFileListInfo: (info: PaneInfo) => void,
  focusTarget: string,
  filter: IFileListItemFilter | null,
  onSelectItemNumChanged: (newSelectItemNum: number) => void,
  accessParentDir: () => void,
  accessDirectry: (dirName: string) => void,
  accessFile: (fileName: string) => void,
  focusOppositePane: () => void,
  getOppositePath: () => void,
  gridRef?: React.RefObject<HTMLDivElement>,
};

export const FileList = forwardRef<FileListFunc, FileListProps>((props, ref) => {
  const [filteredEntries, setFilteredEntries] = useState<FilteredFileListItem[]>([]);

  async function invokeSetCurrentItem(val: string) {
    const paneInfo = await invoke<PaneInfo>("set_focus_item", {
      paneIdx: props.panel_idx,
      focusitem: val,
    });
    props.updateFileListInfo(paneInfo);
  }


  useEffect(() => {
    (async () => {
      const newFilteredFileList = props.fileListInfo
        .map((fileListItem, orgIdx) => { return { item: fileListItem, org_idx: orgIdx, } })
        .filter(item => props.filter?.IsMatch(item.item) ?? true)
      setFilteredEntries(newFilteredFileList);

      props.onSelectItemNumChanged(newFilteredFileList.filter(item => item.item.is_selected).length);

      const isSelectedItemFilterd = props.fileListInfo
        .filter(item => !(props.filter?.IsMatch(item) ?? true))
        .some(item => item.is_selected);
      if (isSelectedItemFilterd) {

        const newSelectionIdx = newFilteredFileList.filter(item => item.item.is_selected).map(item => item.org_idx)
        const paneInfo = await invoke<PaneInfo>("set_selecting_idx", {
          paneIdx: props.panel_idx,
          newSelectIdxList: newSelectionIdx,
        });
        props.updateFileListInfo(paneInfo);
      }

      const foundIndex = newFilteredFileList.findIndex(item => item.item.file_name === props.focusTarget);
      if (foundIndex === -1) {
        const updateFocusItemOnFiltered = () => {
          if (!props.filter) { return; }
          const orgIdx = props.fileListInfo.findIndex(item => item.file_name === props.focusTarget);
          if (orgIdx === -1) { return; }
          const finterdNum = props.fileListInfo.slice(0, orgIdx).filter(item => !props.filter!.IsMatch(item)).length;
          const newIndex = (orgIdx - finterdNum);
          if (!IsValidIndex(props.fileListInfo, newIndex)) { return; }

          const newFocusItem = props.fileListInfo[newIndex].file_name;
          invokeSetCurrentItem(newFocusItem);
        }
      }
    })()
  }, [props.fileListInfo, props.filter, props.focusTarget])


  function invokeSort(sortKey: string) {
    const payloadKey = (() => {
      switch (sortKey) {
        case 'name': return "Name";
        case 'type': return "FileType";
        case 'size': return "Size";
        case 'date': return "Date";
      }
    })();
    invoke('sort_file_list', {
      paneIdx: props.panel_idx,
      sorkKey: payloadKey,
    });
  }

  const addSelectingIndexRange = async (rangeTerm1: number, rangeTerm2: number) => {
    const paneInfo = await invoke<PaneInfo>("add_selecting_idx", {
      paneIdx: props.panel_idx,
      additionalSelectIdxList: SequenceAry(rangeTerm1, rangeTerm2),
    });
    props.updateFileListInfo(paneInfo);
  }

  const [colorSetting, setColorSetting] = useState<FileListRowColorSettings | null>(null);
  useEffect(() => {
    (async () => {
      const color_seting = await readFileListRowColorSetting();
      setColorSetting(color_seting);
    })()
  }, []);



  useEffect(() => {
    myGrid.current?.focus();
  }, []);


  const currentIndex = filteredEntries.findIndex(item => item.item.file_name === props.focusTarget);
  const setCurrentIndex = (newIndex: number) => {
    if (!IsValidIndex(filteredEntries, newIndex)) { return; }
    invokeSetCurrentItem(filteredEntries[newIndex].item.file_name);
  }

  const setupCurrentIndex = (newIndex: number, select: boolean) => {
    if (!IsValidIndex(filteredEntries, newIndex)) { return; }
    if (select) {
      addSelectingIndexRange(currentIndex, newIndex);
    }
    setCurrentIndex(newIndex);
    setAdjustMargin(defaultAdjustMargin);
  }

  const defaultAdjustMargin = 2;
  const [adjustMargin, setAdjustMargin] = useState(defaultAdjustMargin);
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
  useEffect(() => {
    adjustScroll();
  }, []);
  useEffect(() => {
    adjustScroll();
  }, [props.dirctoryPath, props.focusTarget]);

  interface MouseSelectInfo {
    startIndex: number,
    shiftKey: boolean,
    ctrlKey: boolean,
  }
  const [mouseSelectInfo, setMouseSelectInfo] = useState<MouseSelectInfo | null>(null);
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


  const onRowdoubleclick = (row_idx: number, event: React.MouseEvent<Element>) => {
    accessCurrentItem()
    event.stopPropagation();
  };

  const accessCurrentItem = () => {
    if (!IsValidIndex(filteredEntries, currentIndex)) { return; }
    const entry = filteredEntries[currentIndex].item;
    if (entry.is_directory) {
      props.accessDirectry(entry.file_name);
    } else {
      props.accessFile(entry.file_name);
    }
  }

  const selectingItemName = () => {
    if (filteredEntries.length === 0) { return [''] }

    const result = filteredEntries
      .map(item => item.item)
      .filter(item => item.is_selected)
      .map(item => item.file_name);

    return (result.length === 0)
      ? [filteredEntries[currentIndex].item.file_name]
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
    const isSelectAll = filteredEntries.map(item => item.item).every(item => item.is_selected);
    if (isSelectAll) {
      clearSelection();
    } else {
      addSelectingIndexRange(0, filteredEntries.length - 1)
    }
  }
  const clearSelection = async () => {
    const paneInfo = await invoke<PaneInfo>("set_selecting_idx", {
      paneIdx: props.panel_idx,
      newSelectIdxList: [],
    });
    props.updateFileListInfo(paneInfo);
  }
  const toggleSelection = async () => {
    const paneInfo = await invoke<PaneInfo>("toggle_selection", {
      paneIdx: props.panel_idx,
      trgIdx: filteredEntries[currentIndex].org_idx,
    });
    props.updateFileListInfo(paneInfo);
  }
  const selectCurrentOnly = () => {
    setSelectingIndexArray([currentIndex]);
  }

  async function setSelectingIndexArray(newIdxList: Array<number>) {
    const paneInfo = await invoke<PaneInfo>("set_selecting_idx", {
      paneIdx: props.panel_idx,
      newSelectIdxList: [...newIdxList]
        .filter(idx => IsValidIndex(filteredEntries, idx))
        .map(idx => filteredEntries[idx].org_idx),
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

    const entry = filteredEntries[row_idx].item;
    const isSelectionColor = props.isActive && entry.is_selected;
    if (isSelectionColor) {
      return toTableColor(colorSetting.selectionColor);
    }

    const found = colorSetting.settings.find(setting => {
      if (setting.matcher.isDirectory !== entry.is_directory) { return false; }
      if (!MatchImpl(setting.matcher.nameMatcher, entry.file_name)) { return false; }
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

  const theme = useTheme();

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
    const filteredNum = (props.fileListInfo.length - filteredEntries.length);
    if (filteredNum === 0) { return '.' } // 余白を設けるため、空文字にはしない
    return filteredNum + ' file(s) filterd.'
  }

  function FileNameWithEmphasis(fileName: string): React.ReactNode {
    const emphasisIdxAry = (props.filter !== null)
      ? props.filter.GetMatchingIdxAry(fileName)
      : [];
    const charFlagPairs = fileName.split('').map((str, idx) => {
      const flag = emphasisIdxAry.includes(idx);
      return { str, flag };
    });

    return <>
      {charFlagPairs.map((pair, idx) => pair.flag
        ? <b key={idx}>{pair.str}</b>
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
  useImperativeHandle(ref, () => functions);

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
          const entry = item.item;
          return <tbody key={'List' + idx}>
            <tr
              ref={(idx === currentIndex) ? current_row : null}
              onMouseDown={(event) => { onMouseDown(idx, event) }}
              onMouseMove={(event) => { onMouseMove(idx, event) }}
              onMouseUp={(event) => { onMouseUp(idx) }}
              onDoubleClick={(event) => onRowdoubleclick(idx, event)}
              css={table_color(idx)}
            >
              <td>
                <img src={`data:image/bmp;base64,${entry.file_icon ?? ""}`} />
              </td>
              <td css={table_border}>{FileNameWithEmphasis(entry.file_name)}</td>
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
      onMouseUp={(event) => { onMouseUp(filteredEntries.length) }}
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
