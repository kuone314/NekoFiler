import { useState } from 'react';
import React from 'react';
import { executeShellCommand } from './RustFuncs';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { LogInfo } from './LogMessagePane';
import { TextInputStyle } from './ThemeStyle';


///////////////////////////////////////////////////////////////////////////////////////////////////
export interface CommandBarFuncs {
  focus: () => void,
}


export function CommandBar(
  props: {
    path: () => string
    addLogMessage: (message: LogInfo) => void,
    focusToFileList: () => void,
  }
): [JSX.Element, CommandBarFuncs,] {
  const [str, setStr] = useState<string>("");

  const onEnterDown = async () => {
    executeShellCommand('Command Bar', str, props.path());
    setStr("");
  }
  const onKeyDown = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') { onEnterDown(); return; }
    if (event.key === 'Escape') { props.focusToFileList(); return; }
  };

  const ref = React.createRef<HTMLInputElement>();

  const elm = (
    <div style={
      {
        color: '#ff0201',
        flex: 1,
        width: '95%',
      }
    }>
      <input
        style={TextInputStyle()}
        ref={ref}
        type="text"
        placeholder='Input PowerSehll command.(e.g. echo Foo)'
        value={str}
        onChange={e => setStr(e.target.value)}
        onKeyDown={onKeyDown}
        css={css({
          width: '96%',
        })}
      />
    </div>
  );
  return [
    elm,
    {
      focus: () => { ref.current?.focus() }
    }
  ];
}

export default CommandBar;
