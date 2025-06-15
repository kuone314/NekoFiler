
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import React from "react";
import { UnlistenFn, listen } from "@tauri-apps/api/event";
import { Box } from "@mui/material";

import { IoIosArrowDropright, IoIosArrowDropdown } from "react-icons/io";
import { TextInputStyle, useTheme } from "./ThemeStyle";

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
  props: {
    logPaneInfo: LogPaneInfo,
    onClick: () => void,
    onCommandClick: () => void,
  }
) {
  const theme = useTheme();
  const textInputStyle = TextInputStyle(theme.baseColor);

  const logInfo = props.logPaneInfo.logInfo;

  const isError = () => {
    const rc = logInfo.rc ?? 0;
    return logInfo.stderr !== '' || rc !== 0;
  }

  const icon = (isOpen: boolean) => {
    return isOpen
      ? <IoIosArrowDropdown />
      : <IoIosArrowDropright />
  }

  const deteal = () => {
    return <>
      <div onClick={props.onCommandClick} css={css({ userSelect: 'text' })}>
        command{icon(props.logPaneInfo.isCommandOpen)}
      </div>
      {
        props.logPaneInfo.isCommandOpen
          ? <textarea
            style={textInputStyle}
            css={css({ userSelect: 'text', fontSize: '18px', })}
            rows={15}
            cols={1000}
            defaultValue={logInfo.command} />
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
            defaultValue={logInfo.stdout} />
          : <></>
      }
      {
        logInfo.stderr
          ? <textarea
            style={textInputStyle}
            css={css({ userSelect: 'text', fontSize: '18px', })}
            rows={10}
            cols={1000}
            defaultValue={logInfo.stderr} />
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
        onClick={props.onClick}
        css={css({
          display: 'flex',
          flexDirection: 'row',
        })}
      >
        <div
          css={css({
            color: isError() ? theme.baseColor.stringErrorColor : '',
          })}
        >
          {logInfo.title}
        </div>
        {icon(props.logPaneInfo.isOpen)}
      </div>
      {
        props.logPaneInfo.isOpen
          ? deteal()
          : <></>
      }
    </Box >
  </>;
}


type LogMessagePeinProps = {
};

export const LogMessagePein = forwardRef<LogMessagePeinFunc, LogMessagePeinProps>((_props, ref) => {
  useImperativeHandle(ref, () => functions);

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

  const toggleLogPaneOpen = (idx: number) => {
    const newLogAry = [...logAry]
    newLogAry[idx].isOpen = !logAry[idx].isOpen;
    setLogAry(newLogAry);
  }

  const toggleLogPaneCommandOpen = (idx: number) => {
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
          width: '100%',
          overflow: 'auto'
        })}
        ref={logPaneRef}
      >
        {
          logAry.map((logInfo, idx) => <div key={idx} >{
            <LopPane
              logPaneInfo={logInfo}
              onClick={() => toggleLogPaneOpen(idx)}
              onCommandClick={() => toggleLogPaneCommandOpen(idx)} />
          }</div>)
        }
      </div>
    </>
  return element;
});

