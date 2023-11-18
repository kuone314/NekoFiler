import { ApplySeparator } from "./FilePathSeparator";


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

///////////////////////////////////////////////////////////////////////////////////////////////////
export function DirName(dirPath: string): string {
  // ライブラリを使いたいが、良い感じで使える物が見当たらない…。
  const splited = ApplySeparator(dirPath, '/').split('/').reverse();
  if (splited[0].length !== 0) { return splited[0]; }
  return splited[1];
}