import type { SupportedTemporalType } from "./types.ts";
import {
  resolveUnit,
  type ResolvedUnit,
  type TimeUnitName,
  type Unit,
  type UnitName,
} from "./units.ts";

/**
 * The first value of the `unit` that contains `value`. Weeks start on Monday.
 * On a `ZonedDateTime` a day starts when its zone says, which is not always
 * midnight; on an `Instant` hours and below are floored in UTC.
 *
 * @throws {RangeError} if `value` has no such unit, e.g. `"hour"` on a `PlainDate`.
 */
export function startOf(value: SupportedTemporalType, unit: Unit): SupportedTemporalType {
  return startOfUnit(value, resolve(value, unit));
}

/**
 * The last value of the `unit` that contains `value`: the last day on a
 * `PlainDate`, otherwise one nanosecond before the next `unit` starts.
 *
 * @throws {RangeError} if `value` has no such unit, e.g. `"day"` on an `Instant`.
 */
export function endOf(value: SupportedTemporalType, unit: Unit): SupportedTemporalType {
  const resolved = resolve(value, unit);
  const start = startOfUnit(value, resolved);
  // Temporal's plural duration fields are the unit names plus an s.
  const step = { [`${resolved.name}s`]: 1 };

  if (start instanceof Temporal.PlainDate) return start.add(step).subtract({ days: 1 });
  // Floor again: a zoned day can start later than 00:00, and adding a day keeps
  // that wall-clock time even when the next day starts at midnight.
  const next = startOfUnit(add(start, step), resolved) as Exclude<
    SupportedTemporalType,
    Temporal.PlainDate
  >;
  return next.subtract({ nanoseconds: 1 });
}

function startOfUnit(
  value: SupportedTemporalType,
  { name, calendar }: ResolvedUnit,
): SupportedTemporalType {
  if (value instanceof Temporal.PlainDate) return startOfDate(value, name);
  if (value instanceof Temporal.Instant) return value.round(floor(name));

  if (value instanceof Temporal.ZonedDateTime)
    return calendar
      ? startOfDate(value.toPlainDate(), name).toZonedDateTime(value.timeZoneId)
      : value.round(floor(name));

  return calendar
    ? startOfDate(value.toPlainDate(), name).toPlainDateTime()
    : value.round(floor(name));
}

/** `value.add(duration)` without a union-typed receiver. */
function add(value: SupportedTemporalType, duration: Temporal.DurationLike): SupportedTemporalType {
  return (value as Temporal.PlainDateTime).add(duration);
}

function startOfDate(date: Temporal.PlainDate, unit: UnitName): Temporal.PlainDate {
  switch (unit) {
    case "year":
      return date.with({ month: 1, day: 1 });
    case "month":
      return date.with({ day: 1 });
    case "week":
      return date.subtract({ days: date.dayOfWeek - 1 });
    default:
      return date;
  }
}

/** Rounding options that floor to `unit`. Only time units reach `round`; calendar units go through `startOfDate`. */
function floor(unit: UnitName) {
  return { smallestUnit: unit as TimeUnitName, roundingMode: "floor" } as const;
}

/**
 * Resolves `unit` and passes if `value` has it, so a typo or a unit from the
 * wrong type throws instead of Temporal rounding to something else or silently
 * ignoring it.
 *
 * @throws {RangeError} if `unit` is no unit, or `value` has no such unit.
 */
function resolve(value: SupportedTemporalType, unit: Unit): ResolvedUnit {
  const resolved = resolveUnit(unit);
  const hasUnit =
    value instanceof Temporal.PlainDate
      ? resolved.calendar
      : value instanceof Temporal.Instant
        ? !resolved.calendar
        : true;

  if (!hasUnit)
    throw new RangeError(`Chronos: ${value.constructor.name} has no unit ${String(unit)}`);
  return resolved;
}
