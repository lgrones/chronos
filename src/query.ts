import { isBetween as between, type BetweenOptions } from "./shared/between.ts";
import { compare } from "./shared/compare.ts";
import type { UnitOf } from "./shared/units.ts";
import type { SupportedTemporalType } from "./shared/types.ts";
import { defaultTimeZone } from "./shared/zone.ts";

/**
 * Comparisons against another value of the receiver's type. With a `unit`, the
 * receiver stands for the whole `unit` that contains it, as in dayjs:
 * `isSame(other, "month")` is true for any `other` in the receiver's month, and
 * `isBefore(other, "day")` only once `other` is on a later day.
 */
export interface Query<T extends SupportedTemporalType = SupportedTemporalType> {
  /**
   * Whether the receiver falls on today. Today is read in the receiver's zone
   * on a `ZonedDateTime`, otherwise in UTC.
   */
  isToday(): boolean;
  /** Whether the receiver falls on tomorrow, as `isToday` reads today. */
  isTomorrow(): boolean;
  /** Whether the receiver falls on yesterday, as `isToday` reads today. */
  isYesterday(): boolean;
  /** Whether the receiver is strictly before `other`. */
  isBefore(other: T, unit?: UnitOf<T>): boolean;
  /** Whether the receiver is strictly after `other`. */
  isAfter(other: T, unit?: UnitOf<T>): boolean;
  /**
   * Whether the receiver is the same point in time as `other`. On
   * `ZonedDateTime`, zone and calendar are ignored, as in dayjs; with a `unit`,
   * the receiver's zone decides where the `unit` starts and ends.
   */
  isSame(other: T, unit?: UnitOf<T>): boolean;
  /** Whether the receiver is the same as or before `other`. */
  isSameOrBefore(other: T, unit?: UnitOf<T>): boolean;
  /** Whether the receiver is the same as or after `other`. */
  isSameOrAfter(other: T, unit?: UnitOf<T>): boolean;
  /**
   * Whether the receiver lies between `from` and `to`. Bounds are excluded
   * unless `inclusive`, `includeStart` or `includeEnd` say otherwise. Either
   * bound order works, as in dayjs.
   */
  isBetween(from: T, to: T, options?: BetweenOptions<T>): boolean;
}

/** Builds the query methods for `value`. */
export function query(value: SupportedTemporalType): Query {
  const isToday: Query["isToday"] = () => daysFromToday(value) === 0;
  const isTomorrow: Query["isTomorrow"] = () => daysFromToday(value) === 1;
  const isYesterday: Query["isYesterday"] = () => daysFromToday(value) === -1;
  const isSame: Query["isSame"] = (other, unit) => compare(value, other, unit) === 0;
  const isBefore: Query["isBefore"] = (other, unit) => compare(value, other, unit) < 0;
  const isAfter: Query["isAfter"] = (other, unit) => compare(value, other, unit) > 0;
  const isSameOrBefore: Query["isSameOrBefore"] = (other, unit) => compare(value, other, unit) <= 0;
  const isSameOrAfter: Query["isSameOrAfter"] = (other, unit) => compare(value, other, unit) >= 0;

  const isBetween: Query["isBetween"] = (from, to, options) =>
    between([value, value], [from, to], options);

  return {
    isToday,
    isTomorrow,
    isYesterday,
    isSame,
    isBefore,
    isAfter,
    isSameOrBefore,
    isSameOrAfter,
    isBetween,
  };
}

/**
 * How many days the receiver's date lies after today: 0 today, -1 yesterday.
 * Both are dates, so the receiver's type and units never come into it.
 */
function daysFromToday(value: SupportedTemporalType): number {
  const timeZone = value instanceof Temporal.ZonedDateTime ? value.timeZoneId : defaultTimeZone;
  return toDate(value).since(Temporal.Now.plainDateISO(timeZone)).days;
}

/** `value`'s ISO calendar date: in its own zone on a `ZonedDateTime`, in UTC on an `Instant`. */
function toDate(value: SupportedTemporalType): Temporal.PlainDate {
  if (value instanceof Temporal.Instant)
    return value.toZonedDateTimeISO(defaultTimeZone).toPlainDate();
  const date = value instanceof Temporal.PlainDate ? value : value.toPlainDate();
  // `since` throws across calendars, and today is ISO.
  return date.withCalendar("iso8601");
}
