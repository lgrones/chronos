/** The Temporal types `Chronos` accepts as a receiver. */
export type SupportedTemporalType =
  | Temporal.PlainDate
  | Temporal.PlainDateTime
  | Temporal.ZonedDateTime
  | Temporal.Instant;

/**
 * A value with a comparer bound to its Temporal type, like C#'s `IComparable<T>`.
 * Every feature builds on one, so each checks argument types the same way.
 */
export interface Comparable<T extends SupportedTemporalType> {
  /** The wrapped value. */
  readonly value: T;
  /**
   * Orders the receiver against `other`: negative before, 0 same, positive after.
   *
   * @throws {TypeError} if `other` is not the receiver's Temporal type.
   */
  readonly compare: (other: T) => number;
}

/**
 * Finds the Temporal type of `value` once and binds the comparer to it.
 *
 * The comparer is the class's own static `compare` with the receiver filled in,
 * plus one guard: Temporal's `compare` is lenient and coerces its arguments, so
 * `Temporal.PlainDate.compare(date, "2026-10-07")` parses the string and
 * `Temporal.PlainDate.compare(date, zoned)` silently drops time and zone. The
 * types already reject both; the guard makes untyped callers fail loudly too,
 * instead of getting a quiet wrong answer.
 *
 * @throws {TypeError} if `value` is not a supported Temporal type.
 */
export function createComparable(value: SupportedTemporalType): Comparable<SupportedTemporalType> {
  const TemporalClass = classOf(value);
  // `TemporalClass.compare` is a union of four signatures, callable only with an
  // argument that is all four types at once. Each class only ever sees its own.
  const compare = TemporalClass.compare as (
    a: SupportedTemporalType,
    b: SupportedTemporalType,
  ) => number;

  /**
   * Passes `other` through if it has the receiver's Temporal type, so `compare`
   * never sees anything it would coerce.
   *
   * @throws {TypeError} if `other` is a string, another Temporal type or anything else.
   */
  const check = (other: SupportedTemporalType): SupportedTemporalType => {
    if (!(other instanceof TemporalClass)) {
      throw new TypeError(`Chronos: expected ${TemporalClass.name}, got ${describe(other)}`);
    }

    return other;
  };

  return {
    value,
    compare: (other) => compare(value, check(other)),
  };
}

/**
 * Finds the Temporal class of `value`. Reads the global at call time, so a
 * polyfill loaded after this module counts.
 *
 * @throws {TypeError} if `value` is not a supported Temporal type.
 */
function classOf(value: unknown) {
  if (value instanceof Temporal.PlainDate) return Temporal.PlainDate;
  if (value instanceof Temporal.PlainDateTime) return Temporal.PlainDateTime;
  if (value instanceof Temporal.ZonedDateTime) return Temporal.ZonedDateTime;
  if (value instanceof Temporal.Instant) return Temporal.Instant;
  throw new TypeError(`Chronos: expected a Temporal date type, got ${describe(value)}`);
}

/** Names the type of `value` for an error message, e.g. `string` or `Temporal.PlainTime`. */
function describe(value: unknown): string {
  if (value === null) return "null";
  if (typeof value !== "object") return typeof value;
  return Object.prototype.toString.call(value).slice(8, -1);
}
