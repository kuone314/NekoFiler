import { useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api';
import React from 'react';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'


///////////////////////////////////////////////////////////////////////////////////////////////////
export function Updater(
  addLogMessage: (message: string) => void,
): [JSX.Element, () => void,] {
  const [latestVersiton, setLatestVersiton] = useState('');
  const [targetVersiton, setTargetVersiton] = useState('');
  const updateImpl = () => {
    invoke<void>("update_filer", { version: targetVersiton }).catch(
      message => addLogMessage(message))
  }

  const dlg: React.MutableRefObject<HTMLDialogElement | null> = useRef(null);
  const button = () => {
    return <div
      css={css({
        marginLeft: 'auto',
        marginRight: 'auto',
      })}
    >
      <button
        onClick={() => { updateImpl(); dlg.current?.close() }}
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
      <div
      >
        {"Latest:" + latestVersiton}
      </div>
      <div
        css={css({
          display: 'flex',
          flexDirection: 'row',
          height: '10px',
        })}
      >
        <div>
          Update to:
        </div>
        <input
          type="text"
          value={targetVersiton}
          onChange={e => { setTargetVersiton(e.target.value) }}
        />
      </div>
      <div css={css({ height: '30px', })}/>
      {button()}
    </div>
  </dialog>

  const Update = () => {
    (async () => {
      const latest_version = await invoke<string>("get_latest_version", {})
        .catch(() => "");
      setLatestVersiton(latest_version);
      setTargetVersiton(latest_version);
      dlg.current?.showModal();
    })()
  }

  return [dialogElement, Update];
}