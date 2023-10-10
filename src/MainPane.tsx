import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api';
import React from 'react';


import { separator } from './FilePathSeparator';
import { AddressBar, } from './AddressBar';
import { FileList, Entries } from './FileList';
import { CommandInfo, COMMAND_TYPE, match, readCommandsSetting, commandExecuter, BUILDIN_COMMAND_TYPE } from './CommandInfo';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'

import { MenuItem, ControlledMenu } from '@szhsin/react-menu';

import useInterval from 'use-interval';

import { basename, normalize } from '@tauri-apps/api/path';

import { executeShellCommand } from './RustFuncs';

 const dummy: never[] = [];
 
///////////////////////////////////////////////////////////////////////////////////////////////////
export const MainPanel = (
  props: {
    initPath: string,
    pined: boolean,
    onPathChanged: (newPath: string) => void
    onItemNumChanged: (newItemNum: number) => void,
    onSelectItemNumChanged: (newSelectItemNum: number) => void,
    addNewTab: (newTabPath: string) => void,
    removeTab: () => void,
    changeTab: (offset: number) => void,
    getOppositePath: () => string,
    addLogMessage: (message: string) => void,
    separator: separator,
    focusOppositePane: () => void,
    gridRef?: React.RefObject<HTMLDivElement>,
  }
) => {
  const [dir, setDir] = useState<string>(props.initPath);
  useEffect(() => { setDir(props.initPath) }, [props.initPath]);
  const [entries, setEntries] = useState<Entries | null>(null);
  const [initCurrentItemHint, setInitSelectItemHint] = useState<string>('');


  const accessDirectry = async (path: string) => {
    const adjusted = await invoke<AdjustedAddressbarStr>("adjust_addressbar_str", { str: path })
      .catch(error => {
        setDir(path);
        setEntries(null);
        return null;
      }
      );
    if (!adjusted) { return; }
    AccessDirectory(adjusted.dir, adjusted.filename);
  }


  const AccessDirectory = async (newDir: string, trgFile: string) => {
    if (props.pined && dir !== newDir) {
      props.addNewTab(newDir);
      return;
    }

    const newEntries = await invoke<Entries>("get_entries", { path: newDir })
      .catch(err => { return null; });

    setEntries(newEntries);
    setDir(newDir);
    setInitSelectItemHint(trgFile);
  }

  const UpdateList = async () => {
    const newEntries = await invoke<Entries>("get_entries", { path: dir })
      .catch(err => { return null; });

    if (!newEntries) {
      setEntries(null);
    } else {
      if (!entries) {
        setEntries(newEntries);
      } else {
        FileListFunctions.updateEntries(newEntries);
      }
    }
  }

  useEffect(() => {
    props.onItemNumChanged(entries?.length ?? 0);
  }, [entries]);

  useEffect(() => {
    AccessDirectory(dir, "");
    props.onPathChanged(dir);
  }, [dir]);

  useInterval(
    () => UpdateList(),
    1500
  );

  const focusAddoressBar = () => {
    addressBarFunc.focus();
  }

  const addNewTab = () => { props.addNewTab(dir); }
  const removeTab = () => { props.removeTab(); }
  const toPrevTab = () => { props.changeTab(-1); }
  const toNextTab = () => { props.changeTab(+1); }

  const execBuildInCommand = (commandName: string) => {
    switch (commandName) {
      case BUILDIN_COMMAND_TYPE.accessCurrentItem: FileListFunctions.accessCurrentItem(); return;
      case BUILDIN_COMMAND_TYPE.accessParentDir: accessParentDir(); return;
      case BUILDIN_COMMAND_TYPE.moveUp: FileListFunctions.moveUp(); return;
      case BUILDIN_COMMAND_TYPE.moveUpSelect: FileListFunctions.moveUpSelect(); return;
      case BUILDIN_COMMAND_TYPE.moveDown: FileListFunctions.moveDown(); return;
      case BUILDIN_COMMAND_TYPE.moveDownSelect: FileListFunctions.moveDownSelect(); return;
      case BUILDIN_COMMAND_TYPE.moveTop: FileListFunctions.moveTop(); return;
      case BUILDIN_COMMAND_TYPE.moveTopSelect: FileListFunctions.moveTopSelect(); return;
      case BUILDIN_COMMAND_TYPE.moveBottom: FileListFunctions.moveBottom(); return;
      case BUILDIN_COMMAND_TYPE.moveBottomSelect: FileListFunctions.moveBottomSelect(); return;
      case BUILDIN_COMMAND_TYPE.selectAll: FileListFunctions.selectAll(); return;
      case BUILDIN_COMMAND_TYPE.clearSelection: FileListFunctions.clearSelection(); return;
      case BUILDIN_COMMAND_TYPE.toggleSelection: FileListFunctions.toggleSelection(); return;
      case BUILDIN_COMMAND_TYPE.selectCurrentOnly: FileListFunctions.selectCurrentOnly(); return;
      case BUILDIN_COMMAND_TYPE.addNewTab: addNewTab(); return;
      case BUILDIN_COMMAND_TYPE.removeTab: removeTab(); return;
      case BUILDIN_COMMAND_TYPE.toPrevTab: toPrevTab(); return;
      case BUILDIN_COMMAND_TYPE.toNextTab: toNextTab(); return;
      case BUILDIN_COMMAND_TYPE.focusAddoressBar: focusAddoressBar(); return;
      case BUILDIN_COMMAND_TYPE.focusOppositePane: props.focusOppositePane(); return;
    }
  }

  const execCommand = (command: CommandInfo) => {
    if (command.action.type === COMMAND_TYPE.build_in) {
      execBuildInCommand(command.action.command);
      return
    }

    if (command.action.type === COMMAND_TYPE.power_shell) {
      execShellCommand(command, dir, FileListFunctions.selectingItemName(), props.getOppositePath(), props.separator);
      return
    }
  }

  const [keyBindInfo, setKeyBindInfo] = useState<CommandInfo[]>([]);
  useEffect(() => {
    (async () => {
      const seting = await readCommandsSetting();
      setKeyBindInfo(seting);
    })()
  }, []);

  const handlekeyboardnavigation = (keyboard_event: React.KeyboardEvent<HTMLDivElement>) => {

    const validKeyBindInfo = addressBarFunc.isFocus()
      ? keyBindInfo.filter(cmd => cmd.valid_on_addressbar)
      : keyBindInfo;
    const command_ary = validKeyBindInfo.filter(cmd => match(keyboard_event, cmd.key));

    if (command_ary.length !== 0) {
      keyboard_event.preventDefault();
    }

    if (command_ary.length === 1) {
      execCommand(command_ary[0])
      return;
    }

    if (command_ary.length >= 2) {
      menuItemAry.current = command_ary;
      setMenuOpen(true);
      return;
    }

    if (!addressBarFunc.isFocus() && keyboard_event.key.length === 1) {
      FileListFunctions.incremantalSearch(keyboard_event.key)
      return;
    }
  };

  type AdjustedAddressbarStr = {
    dir: string,
    filename: string,
  };

  const accessParentDir = async () => {
    const parentDir = await normalize(dir + props.separator + '..');
    const dirName = await basename(dir);
    AccessDirectory(parentDir, dirName);
  };

  const onDoubleClick = () => {
    accessParentDir();
  }

  const myGrid = props.gridRef ?? React.createRef<HTMLDivElement>();

  const [dialog, execShellCommand] = commandExecuter(
    () => { myGrid.current?.focus() },
    props.addLogMessage,
  );

  const [isMenuOpen, setMenuOpen] = useState(false);
  const menuItemAry = useRef<CommandInfo[]>([]);
  const commandSelectMenu = () => {
    return <ControlledMenu
      state={isMenuOpen ? 'open' : 'closed'}
      onClose={() => { setMenuOpen(false); myGrid?.current?.focus(); }}
      anchorPoint={{ x: 400, y: 1000 }} // 適当…。
    >
      {
        menuItemAry.current.map((command, idx) => {
          return <MenuItem
            onClick={e => execCommand(command)}
            key={idx}
          >
            {command.command_name}
          </MenuItem>
        })
      }
    </ControlledMenu>
  }

  const [fileList, FileListFunctions] = FileList(
    {
      entries: entries ?? dummy,
      initCurrentItemHint: initCurrentItemHint,
      onSelectItemNumChanged: props.onSelectItemNumChanged,
      accessParentDir: accessParentDir,
      accessDirectry: (dirName: string) => accessDirectry(dir + props.separator + dirName),
      accessFile: (fileName: string) => {
        const decoretedPath = '&"./' + fileName + '"';
        executeShellCommand(decoretedPath, dir);
      },
      focusOppositePane: props.focusOppositePane,
      getOppositePath: props.getOppositePath,
      gridRef: myGrid,
    }
  );

  const [addressBar, addressBarFunc] = AddressBar(
    {
      dirPath: dir,
      separator: props.separator,
      confirmInput: (path) => accessDirectry(path),
      onEndEdit: () => myGrid.current?.focus(),
    }
  );

  return (
    <>
      <div
        onKeyDown={handlekeyboardnavigation}
        css={css({
          display: 'grid',
          gridTemplateRows: 'auto 1fr',
          overflow: 'auto',
          width: '100%',
          height: '100%',
        })}
      >
        {addressBar}
        <div
          css={css([{ display: 'grid', overflow: 'auto' }])}
          onDoubleClick={onDoubleClick}
          tabIndex={0}
          ref={myGrid}
        >
          {
            entries
              ? fileList
              : <div>Directry Unfound.</div>
          }
        </div>
      </div>
      {dialog}
      {commandSelectMenu()}
    </>
  );
}
