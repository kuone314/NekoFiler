import { css } from "@emotion/react";
import { TextInputStyle, useTheme } from "./ThemeStyle";

///////////////////////////////////////////////////////////////////////////////////////////////////
export function ColorSelector(
  props: {
    title: string;
    value: string;
    setValue: (value: string) => void;
  }) {
  const theme = useTheme();
  const textInputStyle = TextInputStyle(theme.baseColor);
  return <div
    css={css({
      display: 'flex',
      flexDirection: 'row',
    })}
  >
    <label>{props.title}
    </label>
    <div
      css={css({
        border: '1pt solid ' +theme.baseColor.stringDefaultColor,
        background: props.value,
        width: 40,
      })}
    >
      <input
        type="color"
        list="color-list"
        value={props.value}
        onChange={e => {
          props.setValue(e.target.value);
        }}
        css={css({
          opacity: 0,
        })}
      />
    </div>
    <input
      style={textInputStyle}
      type="text"
      value={props.value}
      onChange={e => {
        props.setValue(e.target.value);
      }} />
  </div>;
}
