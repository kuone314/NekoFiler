import { useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import React from 'react';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { CurrentVersion } from './CurrentVersion';
import { LogInfo } from './LogMessagePane';

import { v4 as uuidv4 } from 'uuid';
import { ButtonStyle, TextInputStyle, useTheme } from './ThemeStyle';

///////////////////////////////////////////////////////////////////////////////////////////////////
export function Updater(
  addLogMessage: (message: LogInfo) => void,
): [JSX.Element, () => void,] {
  const [latestVersion, setLatestVersion] = useState('');
  const [targetVersion, setTargetVersion] = useState('');
  const dlg: React.MutableRefObject<HTMLDialogElement | null> = useRef(null);
  const theme = useTheme();

  const updateImpl = () => {
    invoke<void>("update_filer", { version: targetVersion }).catch(
      message => {
        const message_str = message as string;
        addLogMessage({
          title: 'Update failed.',
          stdout: '',
          stderr: message_str,
          id: uuidv4(),
          command: '',
          rc: null
        });
      })
  }

  const button = () => {
    return <div
      css={css({
        marginLeft: 'auto',
        marginRight: 'auto',
      })}
    >
      <button
        css={ButtonStyle()}
        onClick={() => { updateImpl(); dlg.current?.close() }}
      >
        Ok
      </button>
      <button
        css={ButtonStyle()}
        onClick={() => { dlg.current?.close() }}
      >
        Cancle
      </button>
    </div>
  }

  const dialogElement = <dialog
    ref={dlg}
    css={css({
      background: theme.backgroundColor,
      color: theme.stringDefaultColor,
    })}
  >
    <div
      css={css({
        display: 'grid',
        gridTemplateRows: 'auto auto auto auto',
      })}
    >
      <div
      >
        {"Current:" + CurrentVersion()}
      </div>
      <div
      >
        {"Latest:" + latestVersion}
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
          style={TextInputStyle()}
          type="text"
          value={targetVersion}
          onChange={e => { setTargetVersion(e.target.value) }}
        />
      </div>
      <div css={css({ height: '30px', })} />
      {button()}
    </div>
  </dialog>

  const Update = () => {
    (async () => {
      const latest_version = await invoke<string>("get_latest_version", {})
        .catch(() => "");
      setLatestVersion(latest_version);
      setTargetVersion(latest_version);
      dlg.current?.showModal();
    })()
  }

  return [dialogElement, Update];
}