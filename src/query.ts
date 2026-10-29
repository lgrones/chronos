import { isBetween as between, type BetweenOptions } from "./shared/between.ts";
import { compare } from "./shared/compare.ts";
import type { UnitOf } from "./shared/units.ts";
import type { SupportedTemporalType } from "./shared/types.ts";

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
   * unless `inclusive`, `includeStart` or `includeEnd` say otherwise. Either
   * bound order works, as in dayjs.
   */
  isBetween(from: T, to: T, options?: BetweenOptions<T>): boolean;
}

/** Builds the query methods for `value`. */
export function query(value: SupportedTemporalType): Query {
  const isSame: Query["isSame"] = (other, unit) => compare(value, other, unit) === 0;
  const isBefore: Query["isBefore"] = (other, unit) => compare(value, other, unit) < 0;
  const isAfter: Query["isAfter"] = (other, unit) => compare(value, other, unit) > 0;
  const isSameOrBefore: Query["isSameOrBefore"] = (other, unit) => compare(value, other, unit) <= 0;
  const isSameOrAfter: Query["isSameOrAfter"] = (other, unit) => compare(value, other, unit) >= 0;

  const isBetween: Query["isBetween"] = (from, to, options) =>
    between([value, value], [from, to], options);

  return {
    isSame,
    isBefore,
    isAfter,
    isSameOrBefore,
    isSameOrAfter,
    isBetween,
  };
}
