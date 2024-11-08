import React, { ReactNode, createContext, useContext, useState } from 'react';

import { CSSObjectWithLabel } from 'react-select'

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

///////////////////////////////////////////////////////////////////////////////////////////////////

export type BaseColorSetting = {
  backgroundColor: string;
  elementDefaultColor: string;
  elementHilightColor: string;
  elementSelectionColor: string;
  stringDefaultColor: string;
  stringDisabledColor: string;
  stringErrorColor: string;
};

///////////////////////////////////////////////////////////////////////////////////////////////////
interface ThemeContextType {
  baseColor: BaseColorSetting;
  setBaseColor: (result: BaseColorSetting) => void;
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

export function DefaultBaseColorSetting(): BaseColorSetting {
  return {
    backgroundColor: '#000000',
    elementDefaultColor: '#303030',
    elementHilightColor: '#555555',
    elementSelectionColor: '#336ee6',
    stringDefaultColor: '#ffffff',
    stringDisabledColor: '#c0c0c0',
    stringErrorColor: '#ff0000',
  };
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [color, setColor] = useState<BaseColorSetting>(DefaultBaseColorSetting());

  return (
    <ThemeContext.Provider value={{
      baseColor: color,
      setBaseColor: setColor,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};


///////////////////////////////////////////////////////////////////////////////////////////////////
export function ButtonStyle() {
  const theme = useTheme();

  const style = {
    backgroundColor: theme.baseColor.elementDefaultColor,
    color: theme.baseColor.stringDefaultColor,
    '&:disabled': {
      color: theme.baseColor.stringDisabledColor,
    },
    '&:hover': {
      backgroundColor: theme.baseColor.elementHilightColor,
    },
  };

  return style;
};


///////////////////////////////////////////////////////////////////////////////////////////////////
export function TextInputStyle() {
  const theme = useTheme();

  const style = {
    backgroundColor: theme.baseColor.elementDefaultColor,
    color: theme.baseColor.stringDefaultColor,
  };

  return style;
};

///////////////////////////////////////////////////////////////////////////////////////////////////
export function ReadonlyTextInputStyle() {
  const theme = useTheme();

  const style = {
    backgroundColor: theme.baseColor.backgroundColor,
    color: theme.baseColor.stringDefaultColor,
  };

  return style;
};


///////////////////////////////////////////////////////////////////////////////////////////////////
export function ComboBoxStyle() {
  const theme = useTheme();

  const customStyles = {
    control: (provided: CSSObjectWithLabel) => ({
      ...provided,
      backgroundColor: theme.baseColor.elementDefaultColor,
      '&:hover': {
        borderColor: theme.baseColor.elementHilightColor,
      }
    }),
    menu: (provided: CSSObjectWithLabel) => ({
      ...provided,
      backgroundColor: theme.baseColor.elementDefaultColor
    }),
    option: (
      provided: CSSObjectWithLabel,
      state: any
    ) => ({
      ...provided,
      backgroundColor: state.isSelected ? theme.baseColor.elementSelectionColor : state.isFocused ? theme.baseColor.elementHilightColor : undefined,
      color: theme.baseColor.stringDefaultColor
    }),
    singleValue: (provided: CSSObjectWithLabel) => ({
      ...provided,
      color: theme.baseColor.stringDefaultColor
    })
  };

  return customStyles;
};

///////////////////////////////////////////////////////////////////////////////////////////////////
export function MenuitemStyle() {
  const theme = useTheme();

  return css({
    backgroundColor: theme.baseColor.elementDefaultColor,
    color: theme.baseColor.stringDefaultColor,
    '&:hover': {
      backgroundColor: theme.baseColor.elementSelectionColor,
    },
  });
}


