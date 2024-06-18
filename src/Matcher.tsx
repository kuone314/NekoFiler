
export type Matcher = {
  type: MatchingType;
  string: string;
};

export const MatchingType = {
  regexp: "regexp",
  start_with: "start_with",
} as const;
export type MatchingType = (typeof MatchingType)[keyof typeof MatchingType];

export function MatchImpl(matcher: Matcher, path: string): boolean {
  switch (matcher.type) {
    case MatchingType.regexp: {
      try {
        const pathRegExp = new RegExp(matcher.string, 'i');
        return pathRegExp.test(path);
      } catch {
        // 設定ミスによる、正規表現として不正な文字列が与えられたケースへの対処
        return false;
      }
    }
    case MatchingType.start_with: {
      return path.toLowerCase().startsWith(matcher.string.toLowerCase());
    }
  }
  return false;
}

