import { useEffect, useState } from 'react';
import React from 'react';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'


///////////////////////////////////////////////////////////////////////////////////////////////////
export interface FileFilterBarFunc {
  focus: () => void,
  isFocus: () => boolean,
};

export function FileFilterBar(
  props: {
    onFilterChanged: (filter: string) => void,
  }
): [JSX.Element, FileFilterBarFunc] {
  const [filter, setFilter] = useState<string>('');
  useEffect(() => { props.onFilterChanged(filter); }, [filter]);

  const [isFocus, setIsFocus] = useState(false);

  const inputBoxRef = React.createRef<HTMLInputElement>();
  const element = <div
    css={css({
      display: 'grid',
      gridTemplateColumns: 'auto auto',
      textAlign: 'right',
    })}
  >
    <div>Filter:</div>
    <input
      css={css({
        height: '10px',
      })}
      type="text"
      value={filter}
      onChange={e => setFilter(e.target.value)}
      onFocus={_ => setIsFocus(true)}
      onBlur={_ => setIsFocus(false)}
      ref={inputBoxRef}
    />
  </div>

  return [
    element,
    {
      focus: () => inputBoxRef.current?.focus(),
      isFocus: () => isFocus,
    }];
}
