import { useEffect, useState } from 'react';
import React from 'react';

import { separator, ApplySeparator } from './FilePathSeparator';

import '@szhsin/react-menu/dist/index.css';
import '@szhsin/react-menu/dist/transitions/slide.css';

///////////////////////////////////////////////////////////////////////////////////////////////////
export interface AddressBarFunc {
  focus: () => void,
  isFocus: () => boolean,
};

export function AddressBar(
  props: {
    dirPath: string,
    separator: separator,
    confirmInput: (path: string) => void,
    onEndEdit: () => void,
  }
): [JSX.Element, AddressBarFunc] {
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

  const element = <input
    type="text"
    value={addressbarStr}
    onChange={e => setAddressbarStr(e.target.value)}
    onKeyDown={onKeyDown}
    onFocus={e => { setIsFocused(true), inputBoxRef.current?.select() }}
    onPaste={e => {
      const str = e.clipboardData.getData('text');
      setAddressbarStr(str);
      props.confirmInput(str);
      props.onEndEdit();
    }}
    onBlur={e => { setIsFocused(false), setAddressbarStr(props.dirPath) }}
    ref={inputBoxRef}
  />

  return [element, functions];
}