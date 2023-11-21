
import { useEffect, useState } from "react";

/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import React from "react";
import { UnlistenFn, listen } from "@tauri-apps/api/event";


///////////////////////////////////////////////////////////////////////////////////////////////////
export interface LogMessagePeinFunc {
  addMessage: (message: LogInfo) => void,
}

export interface LogInfo {
  title: string,
  stdout: string,
  stderr: string,
}


export function LogMessagePein()
  : [JSX.Element, LogMessagePeinFunc,] {
  const [logStr, setLogStr] = useState('');


  const addMessage = (message: LogInfo) => {
    setLogStr((prevLogStr) => prevLogStr + '\n' + message.title + '\n' + message.stdout + '\n' + message.stderr);

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

  const textareaRef = React.createRef<HTMLTextAreaElement>();
  useEffect(() => {
    textareaRef.current?.scrollTo(
      textareaRef.current?.scrollWidth ?? 0,
      textareaRef.current?.scrollHeight ?? 0)
  }, [logStr]);

  const functions = {
    addMessage,
  }
  const element =
    <textarea
      css={css({
        height: '100%',
      })}
      value={logStr}
      disabled={true}
      ref={textareaRef}
    />
  return [element, functions];
}
