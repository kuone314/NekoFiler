import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api';
import React from 'react';

import { Box, Button } from '@mui/material';

import 'jqwidgets-scripts/jqwidgets/styles/jqx.base.css';
import 'jqwidgets-scripts/jqwidgets/styles/jqx.material-purple.css';
import JqxGrid, { IGridProps, jqx, IGridColumn, IGridSource } from 'jqwidgets-scripts/jqwidgets-react-tsx/jqxgrid';

import { executeShellCommand } from './RustFuncs';

import styles from './App.module.css'


///////////////////////////////////////////////////////////////////////////////////////////////////
type Entry = {
  type: 'dir' | 'file';
  name: string;
  path: string;
};

type Entries = Array<Entry>;

///////////////////////////////////////////////////////////////////////////////////////////////////
function decoratePath(path: string): string {
  return '"' + path + '"';
}

///////////////////////////////////////////////////////////////////////////////////////////////////
export const PaineTabs = (
  props: {
    pathAry: string[],
    onPathChanged: (path: string) => void,
    onTabsChanged: (inTabs: string[], painIndex: number) => void,
    painIndex: number,
  },
) => {
  const [tabAry, setTabAry] = useState<string[]>(props.pathAry);
  const [activeTabIdx, setActiveTabIdx] = useState<number>(0);
  const addNewTab = (newTabPath: string, addPosIdx: number) => {
    const frontPart = tabAry.splice(0, addPosIdx + 1);
    setTabAry([...frontPart, newTabPath, ...tabAry]);
  }
  const removeTab = (idx: number) => {
    if (tabAry.length === 1) { return; }
    const frontPart = tabAry.splice(0, idx);
    setTabAry([...frontPart, ...tabAry.slice(1)]);
  }

  const onPathChanged = (newPath: string, tabIdx: number) => {
    tabAry[tabIdx] = newPath
    setTabAry(Array.from(tabAry));

    props.onPathChanged(newPath);
  }

  useEffect(() => {
    props.onTabsChanged(tabAry, props.painIndex);
  }, [tabAry]);

  const pathToTabName = (pathStr: string) => {
    const splited = pathStr.split('\\').reverse();
    if (splited[0].length !== 0) { return splited[0]; }
    return splited[1];
  }

  return (
    <>
      <div className={styles.PaineTabs}>
        <div
          className={styles.TabButton}
        >
          {
            tabAry.map((path, idx) => {
              return <Button
                style={
                  {
                    textTransform: 'none',
                    background: '#00ff00',
                    border: (idx === activeTabIdx) ?  '5px solid #0000ff':'5px solid #00ff00' ,
                  }
                }
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
          tabIdx={activeTabIdx}
          onPathChanged={onPathChanged}
          addNewTab={addNewTab}
          removeTab={removeTab}
          key={tabAry[activeTabIdx]}
        />
      </div>
    </>
  )
}

///////////////////////////////////////////////////////////////////////////////////////////////////
const MainPanel = (
  props: {
    initPath: string,
    tabIdx: number,
    onPathChanged: (newPath: string, tabIdx: number) => void
    addNewTab: (newTabPath: string, addPosIdx: number) => void,
    removeTab: (idx: number) => void,
  }
) => {
  const [addressbatStr, setAddressbatStr] = useState<string>("");
  const [dir, setDir] = useState<string>(props.initPath);
  const [entries, setEntries] = useState<Entries>([]);

  useEffect(() => {
    (async () => {
      const entries = await invoke<Entries>("get_entries", { path: dir })
        .catch(err => {
          console.error(err);
          return null;
        });

      if (!entries) { return; }

      setAddressbatStr(dir);
      props.onPathChanged(dir, props.tabIdx);
      setEntries(entries);
    })();
  }, [dir]);

  const convert = (entries: Entries) => {
    const data: IGridProps['source'] = {
      localdata: entries.map(
        (entry: Entry) => { return [entry.name, entry.path]; }
      ),
      datafields:
        [
          { name: 'name', type: 'string', map: '0' },
          { name: 'path', type: 'string', map: '1' },
        ],
      datatype: 'array'
    };
    return data;
  }

  const columns: IGridProps['columns'] =
    [
      { text: 'FIleName', datafield: 'name', width: 240 },
      { text: 'FullPath', datafield: 'path', width: 240 },
    ];

  const onRowdoubleclick = (event?: Event) => {
    if (!event) { return; }

    interface Args {
      args: { rowindex: number; }
    }
    const event_ = event as any as Args;
    accessItemByIdx(event_.args.rowindex);
  };

  const accessItemByIdx = (rowIdx: number) => {
    const entry = entries[rowIdx];
    if (entry.type === "dir") {
      setDir(entry.path)
    } else {
      const decoretedPath = '&"' + entry.path + '"';
      executeShellCommand(decoretedPath, dir);
    }
  }
  const accessSelectingItem = () => {
    const rowIdxAry = myGrid.current?.getselectedrowindexes();
    if (!rowIdxAry) { return; }
    if (rowIdxAry.length !== 1) { return; }
    accessItemByIdx(rowIdxAry[0]);
  }

  const selectingItemPath = () => {
    const rowIdxAry = myGrid.current?.getselectedrowindexes();
    if (!rowIdxAry) { return []; }

    return rowIdxAry
      .map(idx => decoratePath(entries[idx].path))
      ;
  }

  const handlekeyboardnavigation = (event: Event) => {
    const keyboard_event = event as KeyboardEvent;
    if (keyboard_event.type !== 'keydown') { return false; }
    if (keyboard_event.key === 'Enter') {
      accessSelectingItem();
      return true;
    }
    if (keyboard_event.ctrlKey && keyboard_event.key === 't') {
      props.addNewTab(dir, props.tabIdx);
      return true;
    }
    if (keyboard_event.ctrlKey && keyboard_event.key === 'w') {
      props.removeTab(props.tabIdx);
      return true;
    }
    if (keyboard_event.ctrlKey && keyboard_event.key === 'c') {
      const cmd = `
        $target = @(${selectingItemPath().join(',')})
        Add-Type -AssemblyName System.Windows.Forms
        $dataObj = New-Object System.Windows.Forms.DataObject
        $dataObj.SetFileDropList($target)
        $byteStream = [byte[]](([System.Windows.Forms.DragDropEffects]::Copy -as [byte]), 0, 0, 0)
        $memoryStream = [System.IO.MemoryStream]::new($byteStream)
        $dataObj.SetData("Preferred DropEffect", $memoryStream)
        [System.Windows.Forms.Clipboard]::SetDataObject($dataObj, $true)
      `;
      executeShellCommand(cmd, dir);
      return true;
    }
    if (keyboard_event.ctrlKey && keyboard_event.key === 'x') {
      const cmd = `
        $target = @(${selectingItemPath().join(',')})
        Add-Type -AssemblyName System.Windows.Forms
        $dataObj = New-Object System.Windows.Forms.DataObject
        $dataObj.SetFileDropList($target)
        $byteStream = [byte[]](([System.Windows.Forms.DragDropEffects]::Move -as [byte]), 0, 0, 0)
        $memoryStream = [System.IO.MemoryStream]::new($byteStream)
        $dataObj.SetData("Preferred DropEffect", $memoryStream)
        [System.Windows.Forms.Clipboard]::SetDataObject($dataObj, $true)
      `;
      executeShellCommand(cmd, dir);
      return true;
    }
    if (keyboard_event.ctrlKey && keyboard_event.key === 'v') {
      const cmd = `
      Add-Type -AssemblyName System.Windows.Forms

      $dstDir = "${dir}"

      $files = [Windows.Forms.Clipboard]::GetFileDropList() ;
      $data = [Windows.Forms.Clipboard]::GetDataObject()
      $dropEffect = $data.GetData("Preferred DropEffect");
      $flag = $dropEffect.ReadByte();

      if ($flag -band [Windows.Forms.DragDropEffects]::Copy) {
          Copy-Item $files $dstDir
      }
      if ($flag -band [Windows.Forms.DragDropEffects]::Move) {
          Move-Item $files $dstDir
      }
      `;
      executeShellCommand(cmd, dir);
      return true;
    }
    return false;
  };

  type AdjustedAddressbarStr = {
    dir: string,
  };

  const accessParentDir = async () => {
    const adjusted = await invoke<AdjustedAddressbarStr>("adjust_addressbar_str", { str: addressbatStr + '/..' });
    setDir(adjusted.dir);
  };

  const onEnterDown = async () => {
    const adjusted = await invoke<AdjustedAddressbarStr>("adjust_addressbar_str", { str: addressbatStr });

    setDir(adjusted.dir);
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

  const myGrid = React.createRef<JqxGrid>();

  return (
    <>
      <div className={styles.MainPain}>
        <input
          type="text"
          value={addressbatStr}
          onChange={e => setAddressbatStr(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <div
          className={styles.FileList}
          onDoubleClick={onDoubleClick}
        >
          <JqxGrid
            width={'100%'}
            source={convert(entries)}
            columns={columns}
            pageable={false}
            editable={false}
            autoheight={true}
            sortable={true} theme={'material-purple'}
            altrows={true} enabletooltips={true}
            selectionmode={'multiplerowsextended'}
            onRowdoubleclick={onRowdoubleclick}
            handlekeyboardnavigation={handlekeyboardnavigation}
            ref={myGrid}
          />
        </div>
      </div>
    </>
  );
}


