import { useEffect, useState } from 'react';
import React from 'react';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import Select from 'react-select'
import { Entry, IEntryFilter } from './FileList';
import { Sequence } from './Utility';



///////////////////////////////////////////////////////////////////////////////////////////////////
export const FileFilterType = {
  str_match: "str_match",
  reg_expr: "reg_expr",
} as const;
export type FileFilterType = typeof FileFilterType[keyof typeof FileFilterType];

const toComboItem = (type: FileFilterType) => {
  return { value: type, label: comboLabel(type) };
}
const comboLabel = (type: FileFilterType) => {
  switch (type) {
    case 'str_match': return 'str_match'
    case 'reg_expr': return 'reg_expr'
  }
}

///////////////////////////////////////////////////////////////////////////////////////////////////
export interface FileFilterBarFunc {
  addFilterString: (str: string) => void,
  deleteFilterSingleSingle: () => void,
  clearFilter: () => void,
  focus: () => void,
  setType: (filterType: FileFilterType) => void,
  isFocus: () => boolean,
};

export function FileFilterBar(
  props: {
    onFilterChanged: (filter: IEntryFilter | null) => void,
    onEndEdit: () => void,
  }
): [JSX.Element, FileFilterBarFunc] {
  const [filter, setFilter] = useState<string>('');
  const [filterType, setFilterType] = useState<FileFilterType>('str_match');
  useEffect(() => {
    props.onFilterChanged(createFilter());
  }, [filter, filterType]);
  const createFilter = () => {
    if (filter === '') { return null; }
    class FilterImpl implements IEntryFilter {
      IsMatch(entry: Entry): boolean {
        if (filter.length === 0) { return true; }
        return (MatchIndexAry(entry.name.toLowerCase(), filter).length !== 0);
      }
      GetMatchingIdxAry(fileName: string): number[] {
        return MatchIndexAry(fileName.toLowerCase(), filter);
      }
    }

    class RegExprFilter implements IEntryFilter {
      IsMatch(entry: Entry): boolean {
        return (new RegExp(filter)).test(entry.name.toLowerCase());
      }
      GetMatchingIdxAry(fileName: string): number[] {
        const regExp = new RegExp(filter);
        const res = regExp.exec(fileName.toLowerCase());
        if (res === null) { return []; }
        const idx = res.index;
        const len = res[0].length;
        return Sequence(idx, len);
      }
    }

    switch (filterType) {
      case 'str_match': return new FilterImpl;
      case 'reg_expr': return new RegExprFilter;
    }
  }


  const [isFocus, setIsFocus] = useState(false);

  const onKeyDown = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === 'Escape') {
      props.onEndEdit();
      return;
    }
  };

  const inputBoxRef = React.createRef<HTMLInputElement>();
  const element = <div
    css={css({
      display: 'grid',
      gridTemplateColumns: 'auto auto auto',
      textAlign: 'right',
    })}
  >
    <div>Filter:</div>
    <Select
      css={css({
        width: '100pt',
      })}

      options={Object.values(FileFilterType).map(toComboItem)}
      value={toComboItem(filterType)}
      onChange={(val) => {
        if (val === null) { return; }
        setFilterType(val.value);
      }}
    />
    <input
      type="text"
      value={filter}
      onChange={e => setFilter(e.target.value)}
      onKeyDown={onKeyDown}
      onFocus={_ => setIsFocus(true)}
      onBlur={_ => setIsFocus(false)}
      ref={inputBoxRef}
    />
  </div>

  return [
    element,
    {
      addFilterString: (str: string) => setFilter(filter + str),
      deleteFilterSingleSingle: () => setFilter(filter.slice(0, -1)),
      clearFilter: () => setFilter(``),
      focus: () => inputBoxRef.current?.focus(),
      setType: (filterType: FileFilterType) => setFilterType(filterType),
      isFocus: () => isFocus,
    }];
}

///////////////////////////////////////////////////////////////////////////////////////////////////
export function MatchIndexAry(
  filename: string,
  matcherStr: string
): number[] {
  let result: number[] = [];
  for (let idx = 0; idx < matcherStr.length; idx++) {
    const str = matcherStr[idx];
    const prevMatchIdx = result.at(-1);
    const searchStartIdx = (prevMatchIdx === undefined) ? 0 : prevMatchIdx + 1;
    const searchStr = filename.slice(searchStartIdx);
    const foundIdx = searchStr.indexOf(str);
    if (foundIdx === -1) { return []; }
    result.push(searchStartIdx + foundIdx);
  }
  return result;
}
