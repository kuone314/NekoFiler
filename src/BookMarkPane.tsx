import { useEffect, useState } from 'react';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import { Match, TabColorMatchingType, TabColorSetting } from './TabColorSetting';
import { Button } from '@mui/material';
import Select from 'react-select'

import JSON5 from 'json5'
import { invoke } from '@tauri-apps/api/tauri';
import { path } from '@tauri-apps/api';
import { ApplySeparator } from './FilePathSeparator';

///////////////////////////////////////////////////////////////////////////////////////////////////
interface BookMarkItem {
  name: string,
  path: string,
}

///////////////////////////////////////////////////////////////////////////////////////////////////
class BookMarkItemVersiton {
  static first = 1;
  static latest = BookMarkItemVersiton.first;
}

export async function writeBookMarkItem(setting: BookMarkItem[]) {
  const data = JSON5.stringify({ version: BookMarkItemVersiton.latest, data: setting }, null, 2);
  await invoke<String>(
    "write_setting_file", { filename: "bookmark.json5", content: data });
}

export async function readBookMarkItem(): Promise<BookMarkItem[]> {
  try {
    const settingStr = await invoke<String>("read_setting_file", { filename: 'bookmark.json5' })
      .catch(_ => "");
    if (!settingStr || settingStr === "") { return []; }

    const result = JSON5.parse(settingStr.toString()) as { version: number, data: BookMarkItem[] };
    if (result.version > BookMarkItemVersiton.latest) { return []; }

    return result.data;
  } catch {
    return [];
  }
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


  const tabColor = (path: string) => {
    const setting = props.colorSetting.find(setting => Match(setting, path));
    if (!setting) { return ``; }
    return css({
      background: setting.color.backGround,
      color: setting.color.string,
    })
  };

  return <>
    <div>BookMark</div>
    <button
      onClick={() => { AddBookMark(props.currendDir) }}
    >Add Current Dir</button>
    {
      bookMarkItemAry.map((bookMarkItem, idx) => {
        return <tr
          css={[
            tabColor(bookMarkItem.path),
          ]}
          onClick={() => props.accessDirectry(bookMarkItem.path)}
          key={'BookmarkItem' + idx}
        >
          {bookMarkItem.name}
        </tr>
      })
    }
  </>
}