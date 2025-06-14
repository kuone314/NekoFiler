import { forwardRef, useImperativeHandle, useState } from 'react';
import React from 'react';
import { executeShellCommand } from './RustFuncs';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { LogInfo } from './LogMessagePane';
import { TextInputStyle, useTheme } from './ThemeStyle';


///////////////////////////////////////////////////////////////////////////////////////////////////
export interface CommandBarFuncs {
  focus: () => void,
}

type CommandBarProps = {
  path: () => string
  addLogMessage: (message: LogInfo) => void,
  focusToFileList: () => void,
};

export const CommandBar = forwardRef<CommandBarFuncs, CommandBarProps>((props, ref) => {
  useImperativeHandle(ref, () => functions);

  const [str, setStr] = useState<string>("");

  const theme = useTheme();
  const textInputStyle = TextInputStyle(theme.baseColor);

  const onEnterDown = async () => {
    executeShellCommand('Command Bar', str, props.path());
    setStr("");
  }
  const onKeyDown = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') { onEnterDown(); return; }
    if (event.key === 'Escape') { props.focusToFileList(); return; }
  };

  const inputRef = React.createRef<HTMLInputElement>();

  const elm = (
    <div style={
      {
        color: '#ff0201',
        flex: 1,
        width: '95%',
      }
    }>
      <input
        style={textInputStyle}
        ref={inputRef}
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

  const functions = {
    focus: () => { inputRef.current?.focus() }
  };

  return elm;
});

export default CommandBar;
