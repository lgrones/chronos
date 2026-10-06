import { createComparable, type Comparable, type SupportedTemporalType } from "./comparable.ts";

/** Operations that yield a new value of the receiver's type, as raw Temporal. */
export interface Manipulate<T extends SupportedTemporalType = SupportedTemporalType> {
  /**
   * The receiver limited to `min`–`max`.
   *
   * @throws {RangeError} if `min` is after `max`.
   */
  clamp(min: T, max: T): T;
}

/** Builds the manipulate methods for a comparable value. */
export function manipulate({ value, compare }: Comparable<SupportedTemporalType>): Manipulate {
  const clamp: Manipulate["clamp"] = (min, max) => {
    // Compare against the receiver first, so both bounds are type-checked.
    const [low, high] = [compare(min), compare(max)];

    if (createComparable(min).compare(max) > 0)
      throw new RangeError("Chronos: clamp min is after max");

    if (low < 0) return min;
    if (high > 0) return max;
    return value;
  };

  return {
    clamp,
  };
}
