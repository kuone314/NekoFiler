
import { useEffect, useState } from "react";

/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import React from "react";


///////////////////////////////////////////////////////////////////////////////////////////////////
export interface LogMessagePeinFunc {
  addMessage: (message: String) => void,
}

export function LogMessagePein()
  : [JSX.Element, LogMessagePeinFunc,] {
  const [logStr, setLogStr] = useState('');


  const addMessage = (message: String) => {
    setLogStr((prevLogStr) => prevLogStr + '\n' + message);

  };

  const textareaRef = React.createRef<HTMLTextAreaElement>();
  useEffect(() => {
    textareaRef.current?.scrollTo(
      textareaRef.current?.scrollWidth??0,
      textareaRef.current?.scrollHeight??0)
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
      ref={textareaRef}
    />
  return [element, functions];
}
