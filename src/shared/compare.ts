import { endOf, startOf } from "./bounds.ts";
import type { SupportedTemporalType } from "./types.ts";
import type { UnitOf } from "./units.ts";

/**
 * Orders `value` against `other`: negative before, 0 same, positive after.
 *
 * Calls the static `compare` of `value`'s Temporal class, plus one guard:
 * Temporal's `compare` is lenient and coerces its arguments, so
 * `Temporal.PlainDate.compare(date, "2026-10-07")` parses the string and
 * `Temporal.PlainDate.compare(date, zoned)` silently drops time and zone. The
 * types already reject both; the guard makes untyped callers fail loudly too,
 * instead of getting a quiet wrong answer.
 *
 * @throws {TypeError} if `value` is not a supported Temporal type, or `other`
 * is not of `value`'s type.
 */
export function compareExact(value: SupportedTemporalType, other: SupportedTemporalType): number {
  const TemporalClass = classOf(value);

  if (!(other instanceof TemporalClass))
    throw new TypeError(`Chronos: expected ${TemporalClass.name}, got ${describe(other)}`);

  // `TemporalClass.compare` is a union of four signatures, callable only with an
  // argument that is all four types at once. The guard above makes both one type.
  const compareSame = TemporalClass.compare as (
    a: SupportedTemporalType,
    b: SupportedTemporalType,
  ) => number;

  return compareSame(value, other);
}

/**
 * Orders `value` against `other`: negative before, 0 same, positive after. With
 * a `unit`, `value` stands for the whole `unit` that contains it: negative if
 * the `unit` ends before `other`, positive if it starts after, 0 if `other` lies
 * within it.
 *
 * @throws {TypeError} if `other` is not of `value`'s type.
 */
export function compare(
  value: SupportedTemporalType,
  other: SupportedTemporalType,
  unit?: UnitOf<SupportedTemporalType>,
): number {
  if (unit === undefined) return compareExact(value, other);

  if (compareExact(endOf(value, unit), other) < 0) return -1;
  if (compareExact(startOf(value, unit), other) > 0) return 1;
  return 0;
}

/**
 * `a` and `b`, earlier first.
 *
 * @throws {TypeError} if `b` is not of `a`'s type.
 */
export function sort<T extends SupportedTemporalType>(a: T, b: T): [T, T] {
  return compareExact(a, b) > 0 ? [b, a] : [a, b];
}

/**
 * Passes if `value` is a supported Temporal type.
 *
 * @throws {TypeError} if it is not.
 */
export function assertSupported(value: unknown): asserts value is SupportedTemporalType {
  classOf(value);
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
