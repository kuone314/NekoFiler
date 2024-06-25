
///////////////////////////////////////////////////////////////////////////////////////////////////
export class ColorCodeString {
  static new(val: string): ColorCodeString | null {
    if (!isValidColorCode(val)) { return null; }
    return new ColorCodeString(val);
  }

  readonly val: string;

  private constructor(val: string) {
    this.val = val;
  }
}

function isValidColorCode(color: string): boolean {
  const style = new Option().style;
  style.color = color;
  return (style.color !== '');
}
