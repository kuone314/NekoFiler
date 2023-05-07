
import { useState } from "react";

/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";


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

  const functions = {
    addMessage,
  }
  const element =
    <textarea
      css={css({
        height: '100%',
      })}
      value={logStr}
    />
  return [element, functions];
}
