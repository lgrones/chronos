import type { Comparable, SupportedTemporalType } from "./comparable.ts";

/** Comparisons against another value of the receiver's type. */
export interface Query<T> {
  /** Whether the receiver is strictly before `other`. */
  isBefore(other: T): boolean;
  /** Whether the receiver is strictly after `other`. */
  isAfter(other: T): boolean;
  /** Whether the receiver is the same point in time as `other`. On `ZonedDateTime`, zone and calendar are ignored, as in dayjs. */
  isSame(other: T): boolean;
  /** Whether the receiver lies between `from` and `to`. Either bound order works. Bounds are excluded unless `inclusive` is set. */
  isBetween(from: T, to: T, options?: { inclusive?: boolean }): boolean;
}

/** Builds the query methods for a comparable value. */
export function query({
  compare,
}: Comparable<SupportedTemporalType>): Query<SupportedTemporalType> {
  return {
    isBefore: (other) => compare(other) < 0,
    isAfter: (other) => compare(other) > 0,
    isSame: (other) => compare(other) === 0,
    isBetween(from, to, { inclusive = false } = {}) {
      // Between means the bounds sit on opposite sides; 0 means on a bound.
      const sides = compare(from) * compare(to);
      return inclusive ? sides <= 0 : sides < 0;
    },
  };
}
