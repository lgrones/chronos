import { createComparable, type Comparable, type SupportedTemporalType } from "./comparable.ts";

/** Comparisons against another value of the receiver's type. */
export interface Query<T extends SupportedTemporalType = SupportedTemporalType> {
  /** Whether the receiver is strictly before `other`. */
  isBefore(other: T): boolean;
  /** Whether the receiver is strictly after `other`. */
  isAfter(other: T): boolean;
  /** Whether the receiver is the same point in time as `other`. On `ZonedDateTime`, zone and calendar are ignored, as in dayjs. */
  isSame(other: T): boolean;
  /** Whether the receiver is the same as or before `other`. */
  isSameOrBefore(other: T): boolean;
  /** Whether the receiver is the same as or after `other`. */
  isSameOrAfter(other: T): boolean;
  /**
   * Whether the receiver lies between `from` and `to`. Bounds are excluded
   * unless `inclusive` is set. Either bound order works, as in dayjs.
   */
  isBetween(from: T, to: T, options?: { inclusive?: boolean }): boolean;
}

/** Builds the query methods for a comparable value. */
export function query({ compare }: Comparable<SupportedTemporalType>): Query {
  const isSame: Query["isSame"] = (other) => compare(other) === 0;
  const isBefore: Query["isBefore"] = (other) => compare(other) < 0;
  const isAfter: Query["isAfter"] = (other) => compare(other) > 0;
  const isSameOrBefore: Query["isSameOrBefore"] = (other) => compare(other) <= 0;
  const isSameOrAfter: Query["isSameOrAfter"] = (other) => compare(other) >= 0;

  const isBetween: Query["isBetween"] = (from, to, { inclusive = false } = {}) => {
    const [start, end] = createComparable(from).compare(to) > 0 ? [to, from] : [from, to];

    return inclusive
      ? isSameOrAfter(start) && isSameOrBefore(end)
      : isAfter(start) && isBefore(end);
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
