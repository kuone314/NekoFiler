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

