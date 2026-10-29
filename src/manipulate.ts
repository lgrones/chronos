import { compare, type SupportedTemporalType } from "./shared/compare.ts";
import { endOf, startOf, type UnitOf } from "./shared/bounds.ts";

/** Operations that yield a new value of the receiver's type, as raw Temporal. */
export interface Manipulate<T extends SupportedTemporalType = SupportedTemporalType> {
  /**
   * The receiver limited to `min`–`max`.
   *
   * @throws {RangeError} if `min` is after `max`.
   */
  clamp(min: T, max: T): T;
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
  const clamp: Manipulate["clamp"] = (min, max) => {
    // Compare against the receiver first, so both bounds are type-checked.
    const [low, high] = [compare(value, min), compare(value, max)];

    if (compare(min, max) > 0) throw new RangeError("Chronos: clamp min is after max");

    if (low < 0) return min;
    if (high > 0) return max;
    return value;
  };

  return {
    clamp,
    startOf: (unit) => startOf(value, unit),
    endOf: (unit) => endOf(value, unit),
  };
}
