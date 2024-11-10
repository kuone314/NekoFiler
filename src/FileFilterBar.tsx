import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import React from 'react';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import Select from 'react-select'
import { ComboBoxStyle, TextInputStyle } from './ThemeStyle';



///////////////////////////////////////////////////////////////////////////////////////////////////
export const FileFilterType = {
  str_match: "StrMatch",
  reg_expr: "RegExpr",
} as const;
export type FileFilterType = typeof FileFilterType[keyof typeof FileFilterType];

const toComboItem = (type: FileFilterType) => {
  return { value: type, label: comboLabel(type) };
}
const comboLabel = (type: FileFilterType) => {
  switch (type) {
    case 'StrMatch': return 'StrMatch'
    case 'RegExpr': return 'RegExpr'
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

type FileFilterBarProps = {
  onFilterChanged: (filterType: FileFilterType, matcherString: String) => void,
  onEndEdit: () => void,
};

export const FileFilterBar = forwardRef<FileFilterBarFunc, FileFilterBarProps>((props, ref) => {
  useImperativeHandle(ref, () => functions);
  const [matcherString, setMatcherString] = useState<string>('');
  const [filterType, setFilterType] = useState<FileFilterType>('StrMatch');
  useEffect(() => {
    props.onFilterChanged(filterType, matcherString);
  }, [matcherString, filterType]);

  const [isFocus, setIsFocus] = useState(false);

  const textInputStyle = TextInputStyle();
  const comboBoxStyle = ComboBoxStyle();

  const onKeyDown = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === 'Escape') {
      props.onEndEdit();
      return;
    }
  };

  const functions = {
    addFilterString: (str: string) => setMatcherString(matcherString + str),
    deleteFilterSingleSingle: () => setMatcherString(matcherString.slice(0, -1)),
    clearFilter: () => setMatcherString(``),
    focus: () => inputBoxRef.current?.focus(),
    setType: (filterType: FileFilterType) => setFilterType(filterType),
    isFocus: () => isFocus,
  }

  const inputBoxRef = React.createRef<HTMLInputElement>();
  return <div
    css={css({
      display: 'grid',
      gridTemplateColumns: 'auto auto auto',
      textAlign: 'right',
    })}
  >
    <div>Filter:</div>
    <Select
      styles={comboBoxStyle}
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
      style={textInputStyle}
      type="text"
      value={matcherString}
      onChange={e => setMatcherString(e.target.value)}
      onKeyDown={onKeyDown}
      onFocus={_ => setIsFocus(true)}
      onBlur={_ => setIsFocus(false)}
      ref={inputBoxRef}
    />
  </div>
});
