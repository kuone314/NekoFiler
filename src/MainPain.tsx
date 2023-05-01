import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api';
import React from 'react';


import { separator } from './FilePathSeparator';
import { AddressBar, } from './AddressBar';
import { FileList, Entries } from './FileList';
import { CommandInfo, COMMAND_TYPE, match, readCommandsSetting, commandExecuter } from './CommandInfo';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'

import { MenuItem, ControlledMenu } from '@szhsin/react-menu';
import '@szhsin/react-menu/dist/index.css';
import '@szhsin/react-menu/dist/transitions/slide.css';

import useInterval from 'use-interval';

import JSON5 from 'json5'
import { basename, normalize } from '@tauri-apps/api/path';


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
export const MainPanel = (
  props: {
    initPath: string,
    pined: boolean,
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
  const [dir, setDir] = useState<string>(props.initPath);
  const [entries, setEntries] = useState<Entries | null>(null);
  const [initSelectItemHint, setInitSelectItemHint] = useState<string>('');


  const accessDirectry = async (path: string) => {
    const adjusted = await invoke<AdjustedAddressbarStr>("adjust_addressbar_str", { str: path })
      .catch(error => {
        setDir(path);
        setEntries(null);
        return null;
      }
      );
    if (!adjusted) { return; }
    UpdateList(adjusted.dir, adjusted.filename);
  }


  const UpdateList = async (newDir: string, trgFile: string) => {
    if (props.pined && dir !== newDir) {
      props.addNewTab(newDir);
      return;
    }

    const newEntries = await invoke<Entries>("get_entries", { path: newDir })
      .catch(err => { return null; });

    if (JSON.stringify(newEntries) === JSON.stringify(entries) && trgFile === "") {
      return;
    }

    setEntries(newEntries);

    if (!newEntries) { return; }

    setDir(newDir);
    setInitSelectItemHint(trgFile);
  }

  useEffect(() => {
    UpdateList(dir, "");
    props.onPathChanged(dir);
  }, [dir]);

  useInterval(
    () => UpdateList(dir, ""),
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
      case 'accessCurrentItem': FileListFunctions.accessCurrentItem(); return;
      case 'accessParentDir': accessParentDir(); return;
      case 'moveUp': FileListFunctions.moveUp(); return;
      case 'moveUpSelect': FileListFunctions.moveUpSelect(); return;
      case 'moveDown': FileListFunctions.moveDown(); return;
      case 'moveDownSelect': FileListFunctions.moveDownSelect(); return;
      case 'moveTop': FileListFunctions.moveTop(); return;
      case 'moveTopSelect': FileListFunctions.moveTopSelect(); return;
      case 'moveBottom': FileListFunctions.moveBottom(); return;
      case 'moveBottomSelect': FileListFunctions.moveBottomSelect(); return;
      case 'selectAll': FileListFunctions.selectAll(); return;
      case 'toggleSelection': FileListFunctions.toggleSelection(); return;
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
    UpdateList(parentDir, dirName);
  };

  const onDoubleClick = () => {
    accessParentDir();
  }

  const myGrid = props.gridRef ?? React.createRef<HTMLDivElement>();

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

  const [fileList, FileListFunctions] = FileList(
    {
      entries: entries ?? [],
      initSelectItemHint: initSelectItemHint,
      accessParentDir: accessParentDir,
      accessDirectry: (dirName: string) => accessDirectry(dir + props.separator + dirName),
      accessFile: (fileName: string) => { },//todo
      focusOppositePain: props.focusOppositePain,
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

  const merginForDoubleClick = () => {
    return <div style={{ height: 50, }}>. </div>
  }

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
          {merginForDoubleClick()}
        </div>
      </div>
      {dialog}
      {commandSelectMenu()}
    </>
  );
}
