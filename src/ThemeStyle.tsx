import React, { ReactNode, createContext, useContext, useState } from 'react';

import { CSSObjectWithLabel } from 'react-select'

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { BaseColorSetting, DefaultBaseColorSetting } from './BaseColorSetting';

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
export function ButtonStyle(baseColor: BaseColorSetting) {
  const style = {
    backgroundColor: baseColor.elementDefaultColor,
    color: baseColor.stringDefaultColor,
    '&:disabled': {
      color: baseColor.stringDisabledColor,
    },
    '&:hover': {
      backgroundColor: baseColor.elementHilightColor,
    },
  };

  return style;
};


///////////////////////////////////////////////////////////////////////////////////////////////////
export function TextInputStyle(baseColor: BaseColorSetting) {
  const style = {
    backgroundColor: baseColor.elementDefaultColor,
    color: baseColor.stringDefaultColor,
  };

  return style;
};

///////////////////////////////////////////////////////////////////////////////////////////////////
export function ReadonlyTextInputStyle(baseColor: BaseColorSetting) {
  const style = {
    backgroundColor: baseColor.backgroundColor,
    color: baseColor.stringDefaultColor,
  };

  return style;
};


///////////////////////////////////////////////////////////////////////////////////////////////////
export function ComboBoxStyle(baseColor: BaseColorSetting) {
  const customStyles = {
    control: (provided: CSSObjectWithLabel) => ({
      ...provided,
      backgroundColor: baseColor.elementDefaultColor,
      '&:hover': {
        borderColor: baseColor.elementHilightColor,
      }
    }),
    menu: (provided: CSSObjectWithLabel) => ({
      ...provided,
      backgroundColor: baseColor.elementDefaultColor
    }),
    option: (
      provided: CSSObjectWithLabel,
      state: any
    ) => ({
      ...provided,
      backgroundColor: state.isSelected ? baseColor.elementSelectionColor : state.isFocused ? baseColor.elementHilightColor : undefined,
      color: baseColor.stringDefaultColor
    }),
    singleValue: (provided: CSSObjectWithLabel) => ({
      ...provided,
      color: baseColor.stringDefaultColor
    })
  };

  return customStyles;
};

///////////////////////////////////////////////////////////////////////////////////////////////////
export function MenuitemStyle(baseColor: BaseColorSetting) {
  return css({
    backgroundColor: baseColor.elementDefaultColor,
    color: baseColor.stringDefaultColor,
    '&:hover': {
      backgroundColor: baseColor.elementSelectionColor,
    },
  });
}


