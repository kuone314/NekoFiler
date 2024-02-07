import { useEffect, useRef, useState } from 'react';
import React from 'react';
import { executeShellCommand } from './RustFuncs';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { LogInfo } from './LogMessagePane';

type Entry = {
  type: 'dir' | 'file';
  name: string;
  path: string;
};

///////////////////////////////////////////////////////////////////////////////////////////////////
const CommandBar = (props: {
  path: () => string
  addLogMessage: (message: LogInfo) => void,
  focusToFileList: () => void,
}) => {
  const [str, setStr] = useState<string>("");

  const onEnterDown = async () => {
    executeShellCommand('Command Bar',str, props.path());
    setStr("");
  }
  const onKeyDown = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') { onEnterDown(); return; }
    if (event.key === 'Escape') { props.focusToFileList(); return; }
  };

  return (
    <div style={
      {
        color: '#ff0201',
        flex: 1,
        width: '95%',
      }
    }>
      <input
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
}

export default CommandBar;
