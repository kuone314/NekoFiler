
import { useEffect, useState } from "react";

/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import React from "react";
import { UnlistenFn, listen } from "@tauri-apps/api/event";
import { Box } from "@mui/material";

import { IoIosArrowDropright, IoIosArrowDropdown } from "react-icons/io";
import { TextInputStyle } from "./ThemeStyle";

///////////////////////////////////////////////////////////////////////////////////////////////////
export interface LogMessagePeinFunc {
  addMessage: (message: LogInfo) => void,
}

export interface LogPaneInfo {
  isOpen: boolean,
  isCommandOpen: boolean,
  logInfo: LogInfo,
}
export interface LogInfo {
  title: string,
  command: string,
  id: string,
  rc: number | null,
  stdout: string,
  stderr: string,
}

function LopPane(
  logPaneInfo: LogPaneInfo,
  onClick: () => void,
  onCommandClick: () => void,
) {
  const logInfo = logPaneInfo.logInfo;

  const isError = () => {
    const rc = logInfo.rc ?? 0;
    return logInfo.stderr !== '' || rc !== 0;
  }

  const icon = (isOpen: boolean) => {
    return isOpen
      ? <IoIosArrowDropdown />
      : <IoIosArrowDropright />
  }

  const textInputStyle = TextInputStyle();

  const deteal = () => {
    return <>
      <div onClick={onCommandClick} css={css({ userSelect: 'text' })}>
        command{icon(logPaneInfo.isCommandOpen)}
      </div>
      {
        logPaneInfo.isCommandOpen
          ? <textarea
            style={textInputStyle}
            css={css({ userSelect: 'text', fontSize: '18px', })}
            rows={15}
            cols={1000}
            value={logInfo.command} />
          : <></>
      }
      <div>rc:{(logInfo.rc !== null) ? logInfo.rc : ''}</div>
      {
        logInfo.stdout
          ? <textarea
            style={textInputStyle}
            css={css({ userSelect: 'text', fontSize: '18px', })}
            rows={10}
            cols={1000}
            value={logInfo.stdout} />
          : <></>
      }
      {
        logInfo.stderr
          ? <textarea
            style={textInputStyle}
            css={css({ userSelect: 'text', fontSize: '18px', })}
            rows={10}
            cols={1000}
            value={logInfo.stderr} />
          : <></>
      }
    </>
  }

  return <>
    <Box
      css={css({
        width: '100%',
        display: 'block',
        flexShrink: 0,
        border: '1pt solid #000000',
        overflow: 'scroll',
        wordBreak: 'break-all',
        fontSize: '15px',
      })}
    >
      <div
        onClick={onClick}
        css={css({
          display: 'flex',
          flexDirection: 'row',
        })}
      >
        <div
          css={css({
            color: isError() ? 'red' : 'black',
          })}
        >
          {logInfo.title}
        </div>
        {icon(logPaneInfo.isOpen)}
      </div>
      {
        logPaneInfo.isOpen
          ? deteal()
          : <></>
      }
    </Box >
  </>;
}


export function LogMessagePein(props: {
  height: number
})
  : [JSX.Element, LogMessagePeinFunc,] {
  const [logAry, setLogAry] = useState<LogPaneInfo[]>([]);
  const [requireScrollToBottom, setRequireScrollToBottom] = useState(false);


  const addMessage = (message: LogInfo) => {
    setLogAry((prevLogAry) => {
      const idx = prevLogAry.findIndex(logPaneInfo => logPaneInfo.logInfo.id == message.id);
      if (idx === -1) { return [...prevLogAry, { isOpen: true, isCommandOpen: false, logInfo: message }]; }

      const newLogPane = prevLogAry[idx];
      newLogPane.logInfo = message;
      prevLogAry.splice(idx, 1);
      return [...prevLogAry, newLogPane];
    });
    setRequireScrollToBottom(true);
  };

  useEffect(() => {
    let unlisten: UnlistenFn | null;
    (async () => {
      unlisten = await listen('LogMessageEvent', event => {
        addMessage(event.payload as LogInfo);
      });
    })()
    return () => {
      if (unlisten) { unlisten(); }
    }
  }, [])

  const logPaneRef = React.createRef<HTMLDivElement>();
  useEffect(() => {
    if (requireScrollToBottom) { scrollToBottom(); }
    setRequireScrollToBottom(false);
  }, [requireScrollToBottom]);
  const scrollToBottom = () => {
    logPaneRef.current?.scrollTo(
      logPaneRef.current?.scrollWidth ?? 0,
      logPaneRef.current?.scrollHeight ?? 0)
  }

  const toggleLogPaneOpne = (idx: number) => {
    const newLogAry = [...logAry]
    newLogAry[idx].isOpen = !logAry[idx].isOpen;
    setLogAry(newLogAry);
  }

  const toggleLogPaneCommandOpne = (idx: number) => {
    const newLogAry = [...logAry]
    newLogAry[idx].isCommandOpen = !logAry[idx].isCommandOpen;
    setLogAry(newLogAry);
  }

  const functions = {
    addMessage,
  }
  const element =
    <>
      <div
        css={css({
          height: props.height,
          width: '100%',
          overflow: 'scroll'
        })}
        ref={logPaneRef}
      >
        {
          logAry.map((logInfo, idx) => <div key={idx} >{
            LopPane(
              logInfo,
              () => toggleLogPaneOpne(idx),
              () => toggleLogPaneCommandOpne(idx),
            )
          }</div>)
        }
      </div>
    </>
  return [element, functions];
}
