import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import React from 'react';

import { separator, ApplySeparator } from './FilePathSeparator';

import '@szhsin/react-menu/dist/index.css';
import '@szhsin/react-menu/dist/transitions/slide.css';
import { TextInputStyle } from './ThemeStyle';

///////////////////////////////////////////////////////////////////////////////////////////////////
export interface AddressBarFunc {
  focus: () => void,
  isFocus: () => boolean,
};

type AddressBarProps = {
  dirPath: string,
  separator: separator,
  confirmInput: (path: string) => void,
  onEndEdit: () => void,
};
export const AddressBar = forwardRef<AddressBarFunc, AddressBarProps>((props, ref) => {
  const [addressbarStr, setAddressbarStr] = useState<string>(props.dirPath);
  useEffect(() => {
    setAddressbarStr(ApplySeparator(props.dirPath, props.separator));
  }, [props.dirPath, props.separator]);

  const [isFocused, setIsFocused] = useState(false);

  const onKeyDown = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      props.confirmInput(addressbarStr);
      props.onEndEdit();
      return;
    }

    if (event.key === 'Escape') {
      props.onEndEdit();
      return;
    }
  };

  const inputBoxRef = React.createRef<HTMLInputElement>();
  const functions = {
    focus: () => inputBoxRef.current?.focus(),
    isFocus: () => isFocused,
  }
  useImperativeHandle(ref, () => functions);

  return <input
    style={TextInputStyle()}
    type="text"
    value={addressbarStr}
    onChange={e => setAddressbarStr(e.target.value)}
    onKeyDown={onKeyDown}
    onFocus={e => { setIsFocused(true), inputBoxRef.current?.select() }}
    onPaste={e => {
      const pastedText = e.clipboardData.getData('text');

      const input = e.target as HTMLInputElement;
      const selectionStart = input.selectionStart || 0;
      const selectionEnd = input.selectionEnd || 0;

      const str
        = addressbarStr.slice(0, selectionStart)
        + pastedText
        + addressbarStr.slice(selectionEnd);

      setAddressbarStr(str);
      props.confirmInput(str);
    }}
    onBlur={e => { setIsFocused(false), setAddressbarStr(props.dirPath) }}
    ref={inputBoxRef}
  />
});
