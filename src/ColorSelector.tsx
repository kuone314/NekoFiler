import { css } from "@emotion/react";
import { TextInputStyle } from "./ThemeStyle";

///////////////////////////////////////////////////////////////////////////////////////////////////
export function ColorSelector(
  props: {
    title: string;
    value: string;
    setValue: (value: string) => void;
  }) {
  const textInputStyle = TextInputStyle();
  return <label>
    {props.title}
    <input
      style={textInputStyle}
      type="text"
      css={css({ width: '5em', })}
      value={props.value}
      onChange={e => {
        props.setValue(e.target.value);
      }} />
    <input
      type="color"
      list="color-list"
      value={props.value}
      onChange={e => {
        props.setValue(e.target.value);
      }} />
  </label>;
}
