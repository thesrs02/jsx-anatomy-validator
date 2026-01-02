/**
 * Returns elements in `a` that are not in `b`
 */
export const diff = <T>(a: T[], b: T[]): T[] => a.filter((x) => !b.includes(x));

/**
 * Returns duplicate elements in an array
 */
export const dupes = <T>(arr: T[]): T[] =>
  arr.filter((x, i) => arr.indexOf(x) !== i);

/**
 * Checks if array follows a repeating pattern sequence
 */
export const seqMatch = (arr: string[], pattern: string[]): boolean =>
  arr.every((x, i) => x === pattern[i % pattern.length]);
