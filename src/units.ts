import type { SupportedTemporalType } from "./comparable.ts";

/** Units a calendar date has. */
export type CalendarUnit = "year" | "month" | "week" | "day";
/** Units a clock has. */
export type TimeUnit = "hour" | "minute" | "second" | "millisecond";
/** Every unit `startOf`, `endOf` and the comparisons accept. */
export type Unit = CalendarUnit | TimeUnit;

/**
 * The units a value of type `T` supports: a `PlainDate` has no clock, an
 * `Instant` no calendar, the others both.
 */
export type UnitOf<T extends SupportedTemporalType> = T extends Temporal.PlainDate
  ? CalendarUnit
  : T extends Temporal.Instant
    ? TimeUnit
    : Unit;

const calendarUnits: readonly Unit[] = ["year", "month", "week", "day"];
const timeUnits: readonly Unit[] = ["hour", "minute", "second", "millisecond"];

const plural = {
  year: "years",
  month: "months",
  week: "weeks",
  day: "days",
  hour: "hours",
  minute: "minutes",
  second: "seconds",
  millisecond: "milliseconds",
} as const;

/**
 * The first value of the `unit` that contains `value`. Weeks start on Monday.
 * On a `ZonedDateTime` a day starts when its zone says, which is not always
 * midnight; on an `Instant` hours and below are floored in UTC.
 *
 * @throws {RangeError} if `value` has no such unit, e.g. `"hour"` on a `PlainDate`.
 */
export function startOf(value: SupportedTemporalType, unit: Unit): SupportedTemporalType {
  check(value, unit);
  if (value instanceof Temporal.PlainDate) return startOfDate(value, unit);
  if (value instanceof Temporal.Instant) return value.round(floor(unit));

  if (value instanceof Temporal.ZonedDateTime)
    return calendarUnits.includes(unit)
      ? startOfDate(value.toPlainDate(), unit).toZonedDateTime(value.timeZoneId)
      : value.round(floor(unit));

  return calendarUnits.includes(unit)
    ? startOfDate(value.toPlainDate(), unit).toPlainDateTime()
    : value.round(floor(unit));
}

/**
 * The last value of the `unit` that contains `value`: the last day on a
 * `PlainDate`, otherwise one nanosecond before the next `unit` starts.
 *
 * @throws {RangeError} if `value` has no such unit, e.g. `"day"` on an `Instant`.
 */
export function endOf(value: SupportedTemporalType, unit: Unit): SupportedTemporalType {
  const start = startOf(value, unit);
  const step = { [plural[unit]]: 1 };

  if (start instanceof Temporal.PlainDate) return start.add(step).subtract({ days: 1 });
  // Floor again: a zoned day can start later than 00:00, and adding a day keeps
  // that wall-clock time even when the next day starts at midnight.
  const next = startOf(add(start, step), unit) as Exclude<
    SupportedTemporalType,
    Temporal.PlainDate
  >;
  return next.subtract({ nanoseconds: 1 });
}

/** `value.add(duration)` without a union-typed receiver. */
function add(value: SupportedTemporalType, duration: Temporal.DurationLike): SupportedTemporalType {
  return (value as Temporal.PlainDateTime).add(duration);
}

function startOfDate(date: Temporal.PlainDate, unit: Unit): Temporal.PlainDate {
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
function floor(unit: Unit) {
  return { smallestUnit: unit as TimeUnit, roundingMode: "floor" } as const;
}

/**
 * Passes if `value` has `unit`, so a typo or a unit from the wrong type throws
 * instead of Temporal rounding to something else or silently ignoring it.
 *
 * @throws {RangeError} if `value` has no such unit.
 */
function check(value: SupportedTemporalType, unit: Unit): void {
  const allowed =
    value instanceof Temporal.PlainDate
      ? calendarUnits
      : value instanceof Temporal.Instant
        ? timeUnits
        : [...calendarUnits, ...timeUnits];

  if (!allowed.includes(unit))
    throw new RangeError(`Chronos: ${value.constructor.name} has no unit ${String(unit)}`);
}
