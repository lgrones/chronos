import { compare, type SupportedTemporalType } from "./shared/compare.ts";
import { endOf, startOf, type UnitOf } from "./shared/bounds.ts";

/** Operations that yield a new value of the receiver's type, as raw Temporal. */
export interface Manipulate<T extends SupportedTemporalType = SupportedTemporalType> {
  /** The receiver limited to the range between `a` and `b`, in either order. */
  clamp(a: T, b: T): T;
  /**
   * The first value of the `unit` that contains the receiver. Weeks start on
   * Monday. On a `ZonedDateTime` a day starts when its zone says, which is not
   * always midnight; on an `Instant` units are floored in UTC.
   */
  startOf(unit: UnitOf<T>): T;
  /**
   * The last value of the `unit` that contains the receiver: the last day on a
   * `PlainDate`, otherwise one nanosecond before the next `unit` starts.
   */
  endOf(unit: UnitOf<T>): T;
}

/** Builds the manipulate methods for `value`. */
export function manipulate(value: SupportedTemporalType): Manipulate {
  const clamp: Manipulate["clamp"] = (a, b) => {
    // Compare against the receiver first, so both bounds are type-checked.
    const [toA, toB] = [compare(value, a), compare(value, b)];

    if (toA < 0 && toB < 0) return compare(a, b) < 0 ? a : b;
    if (toA > 0 && toB > 0) return compare(a, b) > 0 ? a : b;
    return value;
  };

  return {
    clamp,
    startOf: (unit) => startOf(value, unit),
    endOf: (unit) => endOf(value, unit),
  };
}
