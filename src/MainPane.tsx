import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api';
import React from 'react';


import { separator } from './FilePathSeparator';
import { AddressBar, } from './AddressBar';
import { FileList, Entries, FileListFunc } from './FileList';

import { BUILDIN_COMMAND_TYPE, commandExecuter } from './CommandInfo';
import { KeyBindSetting, COMMAND_TYPE, readKeyBindSetting, match } from './KeyBindInfo';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'

import { MenuItem, ControlledMenu } from '@szhsin/react-menu';

import useInterval from 'use-interval';

import { basename, normalize } from '@tauri-apps/api/path';

import { executeShellCommand } from './RustFuncs';
import { TabFuncs } from './PaneTabs';
import { ContextMenuInfo, readContextMenuSetting } from './ContextMenu';
import { LogInfo } from './LogMessagePane';
import { FileFilterBar, FileFilterType } from './FileFilterBar';
import { MenuitemStyle } from './ThemeStyle';

///////////////////////////////////////////////////////////////////////////////////////////////////
export const MainPanel = (
  props: {
    isActive: boolean,
    panel_idx: number,
    initPath: string,
    pined: boolean,
    onPathChanged: (newPath: string) => void
    onItemNumChanged: (newItemNum: number) => void,
    onSelectItemNumChanged: (newSelectItemNum: number) => void,
    tabFuncs: TabFuncs,
    getOppositePath: () => string,
    addLogMessage: (message: LogInfo) => void,
    separator: separator,
    focusOppositePane: () => void,
    focusCommandBar: () => void,
    gridRef?: React.RefObject<HTMLDivElement>,
    setKeyBind: (trgKey: React.KeyboardEvent<HTMLDivElement> | null) => void,
  }
) => {
  const [dir, setDir] = useState<string>(props.initPath);
  useEffect(() => { setDir(props.initPath) }, [props.initPath]);
  const [isValidDir, setIsValidDir] = useState<boolean>(false);


  const accessDirectry = async (path: string) => {
    const adjusted = await invoke<AdjustedAddressbarStr>("adjust_addressbar_str", { str: path })
      .catch(error => {
        setDir(path);
        setIsValidDir(false);
        return null;
      }
      );
    if (!adjusted) { return; }
    AccessDirectory(adjusted.dir, adjusted.filename);
  }


  const AccessDirectory = async (newDir: string, trgFile: string) => {
    if (props.pined && dir !== newDir) {
      props.tabFuncs.addNewTab(newDir);
      return;
    }

    const newEntries = await invoke<Entries>("get_entries", { path: newDir })
      .catch(err => { return null; });

    setDir(newDir);
    props.onItemNumChanged(newEntries?.length ?? 0);
    setIsValidDir(newEntries !== null);
    if (newEntries !== null) {
      FileListFunctions.current?.initEntries(newEntries, trgFile);
    }
  }

  const UpdateList = async () => {
    const newEntries = await invoke<Entries>("get_entries", { path: dir })
      .catch(err => { return null; });

    props.onItemNumChanged(newEntries?.length ?? 0);

    if (!newEntries) {
      setIsValidDir(false);
    } else {
      if (!isValidDir) {
        FileListFunctions.current?.initEntries(newEntries, "");
      } else {
        FileListFunctions.current?.updateEntries(newEntries);
      }
    }
  }

  useEffect(() => {
    filterBarFunc.clearFilter();
    AccessDirectory(dir, "");
    props.onPathChanged(dir);
  }, [dir]);

  useInterval(
    () => UpdateList(),
    1500
  );

  const focusAddoressBar = () => {
    setFocusToListOnContextMenuClosed(false);
    addressBarFunc.focus();
  }
  const focusFilterBar = () => {
    setFocusToListOnContextMenuClosed(false);
    filterBarFunc.focus();
  }
  const focusCommandBar = () => {
    setFocusToListOnContextMenuClosed(false);
    props.focusCommandBar();
  }



  const addNewTab = () => { props.tabFuncs.addNewTab(dir); }
  const removeTab = () => { props.tabFuncs.removeTab(); }
  const removeOtherTabs = () => { props.tabFuncs.removeOtherTabs(); }
  const removeAllRightTabs = () => { props.tabFuncs.removeAllRightTabs(); }
  const removeAllLeftTabs = () => { props.tabFuncs.removeAllLeftTabs(); }
  const toPrevTab = () => { props.tabFuncs.changeTab(-1); }
  const toNextTab = () => { props.tabFuncs.changeTab(+1); }

  const execBuildInCommand = (
    commandName: string,
    srcKey: React.KeyboardEvent<HTMLDivElement> | null
  ) => {
    switch (commandName) {
      case BUILDIN_COMMAND_TYPE.accessCurrentItem: FileListFunctions.current?.accessCurrentItem(); return;
      case BUILDIN_COMMAND_TYPE.accessParentDir: accessParentDir(); return;
      case BUILDIN_COMMAND_TYPE.moveUp: FileListFunctions.current?.moveUp(); return;
      case BUILDIN_COMMAND_TYPE.moveUpSelect: FileListFunctions.current?.moveUpSelect(); return;
      case BUILDIN_COMMAND_TYPE.moveDown: FileListFunctions.current?.moveDown(); return;
      case BUILDIN_COMMAND_TYPE.moveDownSelect: FileListFunctions.current?.moveDownSelect(); return;
      case BUILDIN_COMMAND_TYPE.moveTop: FileListFunctions.current?.moveTop(); return;
      case BUILDIN_COMMAND_TYPE.moveTopSelect: FileListFunctions.current?.moveTopSelect(); return;
      case BUILDIN_COMMAND_TYPE.moveBottom: FileListFunctions.current?.moveBottom(); return;
      case BUILDIN_COMMAND_TYPE.moveBottomSelect: FileListFunctions.current?.moveBottomSelect(); return;
      case BUILDIN_COMMAND_TYPE.selectAll: FileListFunctions.current?.selectAll(); return;
      case BUILDIN_COMMAND_TYPE.clearSelection: FileListFunctions.current?.clearSelection(); return;
      case BUILDIN_COMMAND_TYPE.toggleSelection: FileListFunctions.current?.toggleSelection(); return;
      case BUILDIN_COMMAND_TYPE.selectCurrentOnly: FileListFunctions.current?.selectCurrentOnly(); return;
      case BUILDIN_COMMAND_TYPE.addNewTab: addNewTab(); return;
      case BUILDIN_COMMAND_TYPE.removeTab: removeTab(); return;
      case BUILDIN_COMMAND_TYPE.removeOtherTabs: removeOtherTabs(); return;
      case BUILDIN_COMMAND_TYPE.removeAllRightTabs: removeAllRightTabs(); return;
      case BUILDIN_COMMAND_TYPE.removeAllLeftTabs: removeAllLeftTabs(); return;
      case BUILDIN_COMMAND_TYPE.toPrevTab: toPrevTab(); return;
      case BUILDIN_COMMAND_TYPE.toNextTab: toNextTab(); return;
      case BUILDIN_COMMAND_TYPE.focusAddoressBar: focusAddoressBar(); return;
      case BUILDIN_COMMAND_TYPE.focusFilterBar: focusFilterBar(); return;
      case BUILDIN_COMMAND_TYPE.deleteFilterSingleSingle: filterBarFunc.deleteFilterSingleSingle(); return;
      case BUILDIN_COMMAND_TYPE.clearFilter: filterBarFunc.clearFilter(); return;
      case BUILDIN_COMMAND_TYPE.setFilterStrMatch: filterBarFunc.setType(`str_match`); return;
      case BUILDIN_COMMAND_TYPE.setFilterRegExp: filterBarFunc.setType(`reg_expr`); return;
      case BUILDIN_COMMAND_TYPE.focusOppositePane: props.focusOppositePane(); return;
      case BUILDIN_COMMAND_TYPE.focusCommandBar: focusCommandBar(); return;
      case BUILDIN_COMMAND_TYPE.setKeyBind: props.setKeyBind(srcKey); return;
    }
  }

  const execCommand = (
    command: KeyBindSetting,
    srcKey: React.KeyboardEvent<HTMLDivElement> | null
  ) => {
    if (command.action.type === COMMAND_TYPE.build_in) {
      execBuildInCommand(command.action.command_name, srcKey);
      return
    }

    if (command.action.type === COMMAND_TYPE.power_shell) {
      execShellCommand(
        command.action.command_name,
        dir,
        FileListFunctions.current?.selectingItemName() ?? [],
        props.getOppositePath(),
        props.separator);
      return
    }
  }

  const [keyBindInfo, setKeyBindInfo] = useState<KeyBindSetting[]>([]);
  useEffect(() => {
    (async () => {
      const seting = await readKeyBindSetting();
      setKeyBindInfo(seting);
    })()
  }, []);

  const handlekeyboardnavigation = (keyboard_event: React.KeyboardEvent<HTMLDivElement>) => {
    if (isMenuOpen || isContextMenuOpen) { return; }
    const isFocusAddressBar = addressBarFunc.isFocus() || filterBarFunc.isFocus();
    const validKeyBindInfo = isFocusAddressBar
      ? keyBindInfo.filter(cmd => cmd.valid_on_addressbar)
      : keyBindInfo;
    const command_ary = validKeyBindInfo.filter(cmd => match(keyboard_event, cmd.key));

    if (command_ary.length !== 0) {
      if (keyboard_event.key === "ContextMenu") {
        setFocusToListOnContextMenuClosed(true);
        setContextMenuOpen(true);
      }
      keyboard_event.preventDefault();
    }

    if (command_ary.length === 1) {
      execCommand(command_ary[0], keyboard_event)
      return;
    }

    if (command_ary.length >= 2) {
      setSrcKey(keyboard_event);
      menuItemAry.current = command_ary;
      setMenuOpen(true);
      setFocusToListOnContextMenuClosed(true);
      return;
    }

    const isSingleKey = // Shiftの押下は、とりあえず許容する事にしておく。
      !keyboard_event.ctrlKey &&
      !keyboard_event.altKey &&
      keyboard_event.key.length === 1;
    if (isSingleKey && !isFocusAddressBar) {
      filterBarFunc.addFilterString(keyboard_event.key)
      return;
    }
  };

  type AdjustedAddressbarStr = {
    dir: string,
    filename: string,
  };

  const accessParentDir = async () => {
    const parentDir = await normalize(dir + props.separator + '..');

    const dirName = await basename(dir).catch(_ => {
      // dir が ドライブ自体(e.g. C:)のケース。
      // 空のパスを指定する事で、ドライブ一覧を出す。
      AccessDirectory("", dir); return null;
    });
    if (dirName === null) { return; }

    AccessDirectory(parentDir, dirName);
  };

  const onDoubleClick = () => {
    accessParentDir();
  }

  const myGrid = props.gridRef ?? React.createRef<HTMLDivElement>();

  const [dialog, execShellCommand] = commandExecuter(
    props.addLogMessage,
    () => { myGrid.current?.focus() },
  );

  const [isMenuOpen, setMenuOpen] = useState(false);
  const [srcKey, setSrcKey] = useState<React.KeyboardEvent<HTMLDivElement> | null>(null);
  useEffect(() => {
    if (!isMenuOpen) {
      if (focusToListOnContextMenuClosed) {
        myGrid?.current?.focus();
      }
    }
  }, [isMenuOpen])

  const [focusToListOnContextMenuClosed, setFocusToListOnContextMenuClosed] = useState(false);
  const menuItemAry = useRef<KeyBindSetting[]>([]);
  const commandSelectMenu = () => {
    return <ControlledMenu
      state={isMenuOpen ? 'open' : 'closed'}
      onClose={() => { setMenuOpen(false); }}
      anchorPoint={{ x: 400, y: 1000 }} // 適当…。
    >
      {
        menuItemAry.current.map((command, idx) => {
          return <MenuItem
            onClick={e => execCommand(command, srcKey)}
            key={idx}
          >
            {command.display_name}
          </MenuItem>
        })
      }
    </ControlledMenu>
  }


  const [contextMenuInfoAry, setContextMenuInfoAry] = useState<ContextMenuInfo[]>([]);
  useEffect(() => {
    (async () => {
      const seting = await readContextMenuSetting();
      setContextMenuInfoAry(seting);
    })()
  }, []);

  const menuItemStyle = MenuitemStyle();

  const [isContextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPosX, setContextMenuPosX] = useState(0);
  const [contextMenuPosY, setContextMenuPosY] = useState(0);
  const contextMenu = () => {
    return <ControlledMenu
      state={isContextMenuOpen ? 'open' : 'closed'}
      onClose={() => { setContextMenuOpen(false); }}
      anchorPoint={{ x: contextMenuPosX, y: contextMenuPosY }} // 適当…。
    >
      {
        contextMenuInfoAry.map((command, idx) => {
          return <MenuItem
            css={menuItemStyle}
            onClick={e => execShellCommand(
              command.command_name,
              dir,
              FileListFunctions.current?.selectingItemName() ?? [],
              props.getOppositePath(),
              props.separator
            )}
            key={idx}
          >
            {command.display_name}
          </MenuItem>
        })
      }
    </ControlledMenu >
  }
  useEffect(() => {
    if (!isContextMenuOpen) {
      if (focusToListOnContextMenuClosed) {
        myGrid?.current?.focus();
      }
    }
  }, [isContextMenuOpen])

  const FileListFunctions = useRef<FileListFunc>(null);

  const nameToPath = (name: string) => (dir.length === 0)
    ? name
    : (dir + props.separator + name);

  const [addressBar, addressBarFunc] = AddressBar(
    {
      dirPath: dir,
      separator: props.separator,
      confirmInput: (path) => accessDirectry(path),
      onEndEdit: () => myGrid.current?.focus(),
    }
  );

  const [filterBar, filterBarFunc] = FileFilterBar(
    {
      onFilterChanged: (filter) => FileListFunctions.current?.setFilter(filter),
      onEndEdit: () => myGrid.current?.focus(),
    }
  );

  return (
    <>
      <div
        onKeyDown={handlekeyboardnavigation}
        css={css({
          display: 'grid',
          gridTemplateRows: 'auto auto 1fr',
          overflow: 'auto',
          width: '100%',
          height: '100%',
        })}
      >
        {contextMenu()}
        {addressBar}
        {filterBar}
        <div
          css={css([{ display: 'grid', overflow: 'auto' }])}
          onDoubleClick={onDoubleClick}
          tabIndex={0}
          ref={myGrid}
          onContextMenu={e => {
            setContextMenuPosX(e.clientX);
            setContextMenuPosY(e.clientY);
            setContextMenuOpen(true);
            e.preventDefault();
          }}
        >
          {
            isValidDir
              ? <FileList
                isActive={props.isActive}
                panel_idx={props.panel_idx}
                onSelectItemNumChanged={props.onSelectItemNumChanged}
                accessParentDir={accessParentDir}
                accessDirectry={(dirName: string) => accessDirectry(nameToPath(dirName))}
                accessFile={(fileName: string) => {
                  const decoretedPath = '&"./' + fileName + '"';
                  executeShellCommand('Access file', decoretedPath, dir);
                }}
                focusOppositePane={props.focusOppositePane}
                getOppositePath={props.getOppositePath}
                gridRef={myGrid}
              />
              : <div>Directry Unfound.</div>
          }
        </div>
      </div>
      {dialog}
      {commandSelectMenu()}
    </>
  );
}
