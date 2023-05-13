import { useEffect, useRef, useState } from 'react';
import React from 'react';
import { executeShellCommand } from './RustFuncs';

type Entry = {
  type: 'dir' | 'file';
  name: string;
  path: string;
};

///////////////////////////////////////////////////////////////////////////////////////////////////
const CommandBar = (props: {
  path: () => string
  addLogMessage: (message: string) => void,
}) => {
  const [str, setStr] = useState<string>("");

  const onEnterDown = async () => {
    props.addLogMessage('---');
    props.addLogMessage(str);
    executeShellCommand(str, props.path());
    setStr("");
  }
  const onEscapeDown = () => {
  }
  const onKeyDown = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') { onEnterDown(); return; }
    if (event.key === 'Escape') { onEscapeDown(); return; }
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
        value={str}
        onChange={e => setStr(e.target.value)}
        onKeyDown={onKeyDown}
        style={
          {
            width: '96%',
          }
        }
      />
    </div>
  );
}

export default CommandBar;
