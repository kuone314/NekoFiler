import { color } from '@mui/system';
import React, { ChangeEvent, ChangeEventHandler, ClipboardEventHandler, FocusEventHandler, KeyboardEventHandler, ReactNode, createContext, useContext, useState } from 'react';

import Select, { CSSObjectWithLabel, GroupBase, OptionProps, SingleValue, StylesConfig } from 'react-select'

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

///////////////////////////////////////////////////////////////////////////////////////////////////
interface ThemeContextType {
  backgroundColor: string;
  setBackgroundColor: (newColor: string) => void;

  elementDefaultColor: string;
  setElementDefaultColor: (newColor: string) => void;
  elementHilightColor: string;
  setElementHilightColor: (newColor: string) => void;
  elementSelectionColor: string;
  setElementSelectionColor: (newColor: string) => void;

  stringDefaultColor: string;
  setStringDefaultColor: (newColor: string) => void;
  stringDisabledColor: string;
  setStringDisabledColor: (newColor: string) => void;
  stringErrorColor: string;
  setStringErrorColor: (newColor: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};


interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [backgroundColor, setBackgroundColor] = useState<string>('#000000');
  const [elementDefaultColor, setElementDefaultColor] = useState<string>('#303030');
  const [elementHilightColor, setElementHilightColor] = useState<string>('#555555');
  const [elementSelectionColor, setElementSelectionColor] = useState<string>('blue')
  const [stringDefaultColor, setStringDefaultColor] = useState<string>('#ffffff');
  const [stringDisabledColor, setStringDisabledColor] = useState<string>('#c0c0c0')
  const [stringErrorColor, setStringErrorColor] = useState<string>('#ff0000')

  return (
    <ThemeContext.Provider value={{
      backgroundColor: backgroundColor,
      setBackgroundColor: setBackgroundColor,
      elementDefaultColor: elementDefaultColor,
      setElementDefaultColor: setElementDefaultColor,
      elementHilightColor: elementHilightColor,
      setElementHilightColor: setElementHilightColor,
      elementSelectionColor: elementSelectionColor,
      setElementSelectionColor: setElementSelectionColor,
      stringDefaultColor: stringDefaultColor,
      setStringDefaultColor: setStringDefaultColor,
      stringDisabledColor: stringDisabledColor,
      setStringDisabledColor: setStringDisabledColor,
      stringErrorColor: stringErrorColor,
      setStringErrorColor: setStringErrorColor,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};


///////////////////////////////////////////////////////////////////////////////////////////////////
export function ButtonStyle() {
  const theme = useTheme();

  const style = {
    backgroundColor: theme.elementDefaultColor,
    color: theme.stringDefaultColor,
    '&:disabled': {
      color: theme.stringDisabledColor,
    },
    '&:hover': {
      backgroundColor: theme.elementHilightColor,
    },
  };

  return style;
};


///////////////////////////////////////////////////////////////////////////////////////////////////
export function TextInputStyle() {
  const theme = useTheme();

  const style = {
    '::placeholder': {
      color: theme.stringDisabledColor,
    },
    backgroundColor: theme.elementDefaultColor,
    color: theme.stringDefaultColor,
  };

  return style;
};


///////////////////////////////////////////////////////////////////////////////////////////////////
export function ComboBoxStyle() {
  const theme = useTheme();

  const customStyles = {
    control: (provided: CSSObjectWithLabel) => ({
      ...provided,
      backgroundColor: theme.elementDefaultColor,
      '&:hover': {
        borderColor: theme.elementHilightColor,
      }
    }),
    menu: (provided: CSSObjectWithLabel) => ({
      ...provided,
      backgroundColor: theme.elementDefaultColor
    }),
    option: (
      provided: CSSObjectWithLabel,
      state: any
    ) => ({
      ...provided,
      backgroundColor: state.isSelected ? theme.elementSelectionColor : state.isFocused ? theme.elementHilightColor : undefined,
      color: theme.stringDefaultColor
    }),
    singleValue: (provided: CSSObjectWithLabel) => ({
      ...provided,
      color: theme.stringDefaultColor
    })
  };

  return customStyles;
};

///////////////////////////////////////////////////////////////////////////////////////////////////
export function MenuitemStyle() {
  const theme = useTheme();

  return css({
    backgroundColor: theme.elementDefaultColor,
    color: theme.stringDefaultColor,
    '&:hover': {
      backgroundColor: theme.elementSelectionColor,
    },
  });
}


