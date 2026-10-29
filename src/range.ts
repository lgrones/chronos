import { isBetween, overlaps, type BetweenOptions } from "./shared/between.ts";
import { assertSupported, sort } from "./shared/compare.ts";
import type { SupportedTemporalType } from "./shared/types.ts";

/**
 * Checks of the receiver range against a `from`–`to` range of the same type.
 * Bounds are excluded unless `inclusive`, `includeStart` or `includeEnd` say
 * otherwise, as in `Chronos(value).isBetween`; a range whose ends are equal is
 * that one moment, and behaves as `Chronos(value)` does. Either bound order
 * works, on both ranges.
 */
export interface Range<T extends SupportedTemporalType = SupportedTemporalType> {
  /** Whether the receiver lies between `from` and `to`. */
  isBetween(from: T, to: T, options?: BetweenOptions<T>): boolean;
  /**
   * Whether the receiver shares a moment with `from`–`to`. By default ranges
   * that only touch, such as 09–10 and 10–11, do not overlap.
   */
  overlaps(from: T, to: T, options?: BetweenOptions<T>): boolean;
}

/**
 * Wraps the range `a`–`b` for one expression:
 * `Chronos.range(checkIn, checkOut).overlaps(opens, closes)`. One overload per
 * type, as with `Chronos(value)`.
 *
 * @throws {TypeError} if `a` is not a supported Temporal type, or `b` is not of
 * `a`'s type.
 */
export interface RangeOf {
  (a: Temporal.PlainDate, b: Temporal.PlainDate): Range<Temporal.PlainDate>;
  (a: Temporal.PlainDateTime, b: Temporal.PlainDateTime): Range<Temporal.PlainDateTime>;
  (a: Temporal.ZonedDateTime, b: Temporal.ZonedDateTime): Range<Temporal.ZonedDateTime>;
  (a: Temporal.Instant, b: Temporal.Instant): Range<Temporal.Instant>;
}

/** Builds the range methods for `a`–`b`. */
export const range = ((a: SupportedTemporalType, b: SupportedTemporalType): Range => {
  assertSupported(a);
  const bounds = sort(a, b);

  return {
    isBetween: (from, to, options) => isBetween(bounds, [from, to], options),
    overlaps: (from, to, options) => overlaps(bounds, [from, to], options),
  };
}) as RangeOf;
