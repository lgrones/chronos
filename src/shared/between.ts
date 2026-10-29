import { compare, sort } from "./compare.ts";
import type { SupportedTemporalType } from "./types.ts";
import type { UnitOf } from "./units.ts";

/**
 * Which bounds of a `from`–`to` range count, and the unit to compare by. Bounds
 * are excluded unless `inclusive` is set; `includeStart` and `includeEnd`
 * override it for the earlier or later bound.
 */
export interface BetweenOptions<T extends SupportedTemporalType = SupportedTemporalType> {
  /** Whether both bounds count. */
  inclusive?: boolean;
  /** Whether the earlier bound counts. Overrides `inclusive`. */
  includeStart?: boolean;
  /** Whether the later bound counts. Overrides `inclusive`. */
  includeEnd?: boolean;
  /**
   * Compare by `unit`: the receiver stands for the whole `unit` that contains
   * it, so an excluded bound excludes its whole `unit` too.
   */
  unit?: UnitOf<T>;
}

/** Whether `start`–`end` lies between `from` and `to`, in either order. */
export function isBetween(
  [start, end]: [SupportedTemporalType, SupportedTemporalType],
  [from, to]: [SupportedTemporalType, SupportedTemporalType],
  options: BetweenOptions = {},
): boolean {
  const { includeStart, includeEnd, unit } = resolve(options);
  [from, to] = sort(from, to);

  return isAfter(start, from, includeStart, unit) && isBefore(end, to, includeEnd, unit);
}

/** Whether `start`–`end` shares a moment with `from`–`to`, in either order. */
export function overlaps(
  [start, end]: [SupportedTemporalType, SupportedTemporalType],
  [from, to]: [SupportedTemporalType, SupportedTemporalType],
  options: BetweenOptions = {},
): boolean {
  const { includeStart, includeEnd, unit } = resolve(options);
  [from, to] = sort(from, to);

  // The receiver ends after the other range starts, and starts before it ends.
  return isAfter(end, from, includeStart, unit) && isBefore(start, to, includeEnd, unit);
}

/** Whether `value` is after `bound`, or on it when `bound` is included. */
function isAfter(
  value: SupportedTemporalType,
  bound: SupportedTemporalType,
  included: boolean,
  unit: UnitOf<SupportedTemporalType> | undefined,
): boolean {
  const order = compare(value, bound, unit);
  return included ? order >= 0 : order > 0;
}

/** Whether `value` is before `bound`, or on it when `bound` is included. */
function isBefore(
  value: SupportedTemporalType,
  bound: SupportedTemporalType,
  included: boolean,
  unit: UnitOf<SupportedTemporalType> | undefined,
): boolean {
  const order = compare(value, bound, unit);
  return included ? order <= 0 : order < 0;
}

function resolve({ inclusive = false, includeStart, includeEnd, unit }: BetweenOptions) {
  return { includeStart: includeStart ?? inclusive, includeEnd: includeEnd ?? inclusive, unit };
}
