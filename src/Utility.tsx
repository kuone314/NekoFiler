

///////////////////////////////////////////////////////////////////////////////////////////////////
export function IsValidIndex<T>(ary: T[], idx: number): boolean {
  return 0 <= idx && idx < ary.length;
}

export function LastIndex<T>(ary: T[]): number {
  return ary.length - 1;
}

///////////////////////////////////////////////////////////////////////////////////////////////////
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
