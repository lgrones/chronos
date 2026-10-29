import { compare as compareExact, type SupportedTemporalType } from "./shared/compare.ts";
import { endOf, startOf, type UnitOf } from "./shared/bounds.ts";

/**
 * Comparisons against another value of the receiver's type. With a `unit`, the
 * receiver stands for the whole `unit` that contains it, as in dayjs:
 * `isSame(other, "month")` is true for any `other` in the receiver's month, and
 * `isBefore(other, "day")` only once `other` is on a later day.
 */
export interface Query<T extends SupportedTemporalType = SupportedTemporalType> {
  /** Whether the receiver is strictly before `other`. */
  isBefore(other: T, unit?: UnitOf<T>): boolean;
  /** Whether the receiver is strictly after `other`. */
  isAfter(other: T, unit?: UnitOf<T>): boolean;
  /**
   * Whether the receiver is the same point in time as `other`. On
   * `ZonedDateTime`, zone and calendar are ignored, as in dayjs; with a `unit`,
   * the receiver's zone decides where the `unit` starts and ends.
   */
  isSame(other: T, unit?: UnitOf<T>): boolean;
  /** Whether the receiver is the same as or before `other`. */
  isSameOrBefore(other: T, unit?: UnitOf<T>): boolean;
  /** Whether the receiver is the same as or after `other`. */
  isSameOrAfter(other: T, unit?: UnitOf<T>): boolean;
  /**
   * Whether the receiver lies between `from` and `to`. Bounds are excluded
   * unless `inclusive` is set. Either bound order works, as in dayjs.
   */
  isBetween(from: T, to: T, options?: { inclusive?: boolean; unit?: UnitOf<T> }): boolean;
}

/** Builds the query methods for `value`. */
export function query(value: SupportedTemporalType): Query {
  /**
   * Orders the receiver's `unit` against `other`: negative if it ends before
   * `other`, positive if it starts after, 0 if `other` lies within it.
   */
  const compare = (other: SupportedTemporalType, unit?: UnitOf<SupportedTemporalType>) => {
    // Compare unfloored first, so `other` is type-checked before it is used.
    if (unit === undefined) return compareExact(value, other);

    if (compareExact(endOf(value, unit), other) < 0) return -1;
    if (compareExact(startOf(value, unit), other) > 0) return 1;
    return 0;
  };

  const isSame: Query["isSame"] = (other, unit) => compare(other, unit) === 0;
  const isBefore: Query["isBefore"] = (other, unit) => compare(other, unit) < 0;
  const isAfter: Query["isAfter"] = (other, unit) => compare(other, unit) > 0;
  const isSameOrBefore: Query["isSameOrBefore"] = (other, unit) => compare(other, unit) <= 0;
  const isSameOrAfter: Query["isSameOrAfter"] = (other, unit) => compare(other, unit) >= 0;

  const isBetween: Query["isBetween"] = (from, to, { inclusive = false, unit } = {}) => {
    const [start, end] = compareExact(from, to) > 0 ? [to, from] : [from, to];

    return inclusive
      ? isSameOrAfter(start, unit) && isSameOrBefore(end, unit)
      : isAfter(start, unit) && isBefore(end, unit);
  };

  return {
    isSame,
    isBefore,
    isAfter,
    isSameOrBefore,
    isSameOrAfter,
    isBetween,
  };
}
