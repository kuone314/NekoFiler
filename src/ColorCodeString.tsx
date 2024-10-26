
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

  toRGB(): { r: number, g: number, b: number } {
    const hexValue = this.val.replace('#', '');
    const isOmit = hexValue.length === 3; // #fffなどの省略記法か

    const splited = hexValue.match(isOmit ? /./g : /.{2}/g);
    if (!splited) { return { r: 0, g: 0, b: 0, }; }
    const [r, g, b] = splited
      .map((s) => parseInt(isOmit ? s.repeat(2) : s, 16));

    return { r, g, b };
  }
}

function isValidColorCode(color: string): boolean {
  const style = new Option().style;
  style.color = color;
  return (style.color !== '');
}
