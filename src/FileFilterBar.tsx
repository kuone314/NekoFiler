import { useEffect, useState } from 'react';
import React from 'react';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { Entry, IEntryFilter, MatchIndexAry } from './FileList';



///////////////////////////////////////////////////////////////////////////////////////////////////
export interface FileFilterBarFunc {
  focus: () => void,
  isFocus: () => boolean,
};

export function FileFilterBar(
  props: {
    onFilterChanged: (filter: IEntryFilter | null) => void,
  }
): [JSX.Element, FileFilterBarFunc] {
  const [filter, setFilter] = useState<string>('');
  useEffect(() => {
    if (filter === '') {
      props.onFilterChanged(null);
    } else {
      class FilterImpl implements IEntryFilter {
        IsMatch(entry: Entry): boolean {
          if (filter.length === 0) { return true; }
          return (MatchIndexAry(entry.name, filter).length !== 0);
        }
        GetMatchingIdxAry(fileName: string): number[] {
          return MatchIndexAry(fileName, filter);
        }
      }
      props.onFilterChanged(new FilterImpl);
    }
  }, [filter]);

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
