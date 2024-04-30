import { useEffect, useRef, useState } from 'react';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import { TabColor, TabColorMatchingType, TabColorSetting } from './TabColorSetting';
import { Button } from '@mui/material';
import Select from 'react-select'

import JSON5 from 'json5'
import { invoke } from '@tauri-apps/api/tauri';
import { path } from '@tauri-apps/api';
import { ApplySeparator } from './FilePathSeparator';
import { ISettingInfo, readSettings, writeSettings } from './ReadWriteSettings';

///////////////////////////////////////////////////////////////////////////////////////////////////
interface BookMarkItem {
  name: string,
  path: string,
}

///////////////////////////////////////////////////////////////////////////////////////////////////
class Version {
  static oldest = 2;
  static latest = Version.oldest;
}

class SettingInfo implements ISettingInfo<BookMarkItem[]> {
  filePath = "device_specific/bookmark.json5";
  latestVersion = Version.oldest;
  IsValidVersion = (version: number) => {
    if (version < Version.oldest) { return false; }
    if (version > Version.latest) { return false; }
    return true;
  };
  UpgradeSetting = (readVersion: number, readSetting: BookMarkItem[]) => readSetting;
}

export async function writeBookMarkItem(setting: BookMarkItem[]) {
  writeSettings(new SettingInfo, setting);
}

export async function readBookMarkItem(): Promise<BookMarkItem[]> {
  const read = await readSettings(new SettingInfo);
  return read ?? [];
}

///////////////////////////////////////////////////////////////////////////////////////////////////
function IsValidIndex<T>(
  ary: T[],
  idx: number
) {
  return 0 <= idx && idx < ary.length;
}

///////////////////////////////////////////////////////////////////////////////////////////////////
export function BookMarkPane(
  props: {
    height: number
    colorSetting: TabColorSetting[]
    currendDir: string
    accessDirectry: (dir: string) => void
  }
) {
  const [bookMarkItemAry, setBookMarkItemAry] = useState<BookMarkItem[]>([]);
  useEffect(() => {
    (async () => { setBookMarkItemAry(await readBookMarkItem()); })()
  }, []);

  const AddBookMark = (path: string) => {
    const dirName = (() => {
      const splited = ApplySeparator(path, '/').split('/').reverse();
      if (splited[0].length !== 0) { return splited[0]; }
      return splited[1];
    })();

    const newBookMarkItemAry = [...bookMarkItemAry, { path: path, name: dirName }]
    setBookMarkItemAry(newBookMarkItemAry)
    writeBookMarkItem(newBookMarkItemAry)
  }

  const [currentIndex, setCurrentIndex] = useState(0);

  function RemoveBookMark(trgIdx: number) {
    if (!IsValidIndex(bookMarkItemAry, trgIdx)) { return; }
    let newBookMarkItemAry = Array.from(bookMarkItemAry);
    newBookMarkItemAry.splice(trgIdx, 1);
    setBookMarkItemAry(newBookMarkItemAry);
    writeBookMarkItem(newBookMarkItemAry);
    if (!IsValidIndex(newBookMarkItemAry, currentIndex)) {
      setCurrentIndex(Math.max(newBookMarkItemAry.length - 1, 0));
    }
  }
  function MoveUpBookMark(trgIdx: number) {
    if (!IsValidIndex(bookMarkItemAry, trgIdx)) { return; }
    if (!IsValidIndex(bookMarkItemAry, trgIdx - 1)) { return; }
    let newBookMarkItemAry = Array.from(bookMarkItemAry);
    [newBookMarkItemAry[trgIdx], newBookMarkItemAry[trgIdx - 1]] = [newBookMarkItemAry[trgIdx - 1], newBookMarkItemAry[trgIdx]]
    setBookMarkItemAry(newBookMarkItemAry);
    writeBookMarkItem(newBookMarkItemAry);
    setCurrentIndex(trgIdx - 1);
  }

  function MoveDownBookMark(trgIdx: number) {
    if (!IsValidIndex(bookMarkItemAry, trgIdx)) { return; }
    if (!IsValidIndex(bookMarkItemAry, trgIdx + 1)) { return; }
    let newBookMarkItemAry = Array.from(bookMarkItemAry);
    [newBookMarkItemAry[trgIdx], newBookMarkItemAry[trgIdx + 1]] = [newBookMarkItemAry[trgIdx + 1], newBookMarkItemAry[trgIdx]]
    setBookMarkItemAry(newBookMarkItemAry);
    writeBookMarkItem(newBookMarkItemAry);
    setCurrentIndex(trgIdx + 1);
  }

  const [editDlg, EditStart] = BookMarkEditor(
    (editedBookMarkItem: BookMarkItem) => {
      let newBookMarkItemAry = Array.from(bookMarkItemAry);
      newBookMarkItemAry[currentIndex] = editedBookMarkItem;
      setBookMarkItemAry(newBookMarkItemAry);
      writeBookMarkItem(newBookMarkItemAry);
    }
  );

  return <>
    {editDlg}
    <div>BookMark</div>
    <button
      onClick={() => { AddBookMark(props.currendDir) }}
    >Add Current Dir</button>
    <button
      onClick={() => {
        if (!IsValidIndex(bookMarkItemAry, currentIndex)) { return; }
        EditStart(bookMarkItemAry[currentIndex])
      }}
    >Edit</button>
    <button
      onClick={() => { RemoveBookMark(currentIndex) }}
    >-</button>
    <button
      onClick={() => { MoveUpBookMark(currentIndex) }}
    >↑</button>
    <button
      onClick={() => { MoveDownBookMark(currentIndex) }}
    >↓</button>
    {
      bookMarkItemAry.map((bookMarkItem, idx) => {
        return <div
          css={[
            TabColor(
              props.colorSetting,
              3,
              idx == currentIndex,
              bookMarkItem.path),
          ]}
          onClick={() => setCurrentIndex(idx)}
          onDoubleClick={() => props.accessDirectry(bookMarkItem.path)}
          key={'BookmarkItem' + idx}
        >
          {bookMarkItem.name}
        </div>
      })
    }
  </>
}

///////////////////////////////////////////////////////////////////////////////////////////////////
export function BookMarkEditor(
  onOk: (editedBookMarkItem: BookMarkItem) => void,
): [JSX.Element, (srcBookMarkItem: BookMarkItem) => void,] {
  const [name, setName] = useState('');
  const [path, setPath] = useState('');


  const dlg: React.MutableRefObject<HTMLDialogElement | null> = useRef(null);
  const button = () => {
    return <div
      css={css({
        marginLeft: 'auto',
        marginRight: 'auto',
      })}
    >
      <button
        onClick={() => { onOk({ name, path }); dlg.current?.close() }}
      >
        Ok
      </button>
      <button
        onClick={() => { dlg.current?.close() }}
      >
        Cancle
      </button>
    </div>
  }

  const dialogElement = <dialog ref={dlg}>
    <div
      css={css({
        display: 'grid',
        gridTemplateRows: 'auto auto auto auto',
      })}
    >
      <input
        type="text"
        value={name}
        onChange={e => { setName(e.target.value) }}
      />
      <input
        type="text"
        value={path}
        onChange={e => { setPath(e.target.value) }}
      />
      <div css={css({ height: '30px', })} />
      {button()}
    </div>
  </dialog>

  const EditStart = (srcBookMarkItem: BookMarkItem) => {
    setName(srcBookMarkItem.name);
    setPath(srcBookMarkItem.path);
    dlg.current?.showModal();
  }

  return [dialogElement, EditStart];
}