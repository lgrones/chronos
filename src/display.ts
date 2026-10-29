import { compareExact } from "./shared/compare.ts";
import { tokenizer } from "./shared/tokens.ts";
import type { SupportedTemporalType } from "./shared/types.ts";

/** The locale text is written in unless the caller names one. */
const defaultLocale = "de-AT";

/** The time zone used where a value has none and the caller names none. */
const defaultTimeZone = "UTC";

/** A token pattern, which an `Instant` does not take: it has no wall clock to read. */
type Pattern<T extends SupportedTemporalType> = T extends Temporal.Instant ? never : string;

/** The receiver as text: by a pattern, by `Intl` options, or relative to another moment. */
export interface Display<T extends SupportedTemporalType = SupportedTemporalType> {
  /**
   * The receiver by a dayjs-style `pattern`: `format("DD.MM.YYYY HH:mm")`. The
   * tokens are those of `Chronos.parse`, so text formatted by a pattern parses
   * back by the same pattern. Literal text goes in `[brackets]`. An `Instant`
   * has no wall clock: convert it with `toZonedDateTimeISO` first.
   *
   * @throws {RangeError} if a `PlainDate` pattern has a time.
   */
  format(pattern: Pattern<T>): string;
  /**
   * The receiver by `Intl.DateTimeFormat` `options`, in `locale`, `de-AT` by
   * default. An `Instant` is shown in UTC unless `options.timeZone` says
   * otherwise.
   */
  format(options?: Intl.DateTimeFormatOptions, locale?: Intl.LocalesArgument): string;
  /**
   * How far the receiver lies from `other`, in `locale`, `de-AT` by default:
   * "vor 3 Tagen", "in 2 Stunden". The unit and rounding follow dayjs's
   * `relativeTime`; under 45 seconds is "jetzt", and a `PlainDate` on the same
   * day "heute". On a `ZonedDateTime` the receiver's zone decides where days,
   * months and years start; an `Instant` counts them in UTC.
   */
  from(other: T, locale?: Intl.LocalesArgument): string;
  /**
   * How far the receiver lies from now, as `from`. Now is read in the
   * receiver's zone on a `ZonedDateTime`, otherwise in UTC.
   */
  fromNow(locale?: Intl.LocalesArgument): string;
}

/** Builds the display methods for `value`. */
export function display(value: SupportedTemporalType): Display {
  const format = ((
    patternOrOptions?: string | Intl.DateTimeFormatOptions,
    locale: Intl.LocalesArgument = defaultLocale,
  ) => {
    if (typeof patternOrOptions === "string") return formatPattern(value, patternOrOptions);

    // `Instant.toLocaleString` falls back to the system's zone; keep it independent of the machine.
    const options =
      value instanceof Temporal.Instant
        ? { timeZone: defaultTimeZone, ...patternOrOptions }
        : patternOrOptions;

    return value.toLocaleString(locale, options);
  }) as Display["format"];

  return {
    format,
    from: (other, locale) => relative(value, other, locale),
    fromNow: (locale) => relative(value, now(value), locale),
  };
}

const pad = (n: number, width: number) => String(n).padStart(width, "0");

/** Pattern tokens a date fills, as in dayjs `format`. */
const dateTokens: Partial<Record<string, (date: Temporal.PlainDate) => string>> = {
  YYYY: (date) => pad(date.year, 4),
  YY: (date) => pad(date.year % 100, 2),
  MM: (date) => pad(date.month, 2),
  M: (date) => String(date.month),
  DD: (date) => pad(date.day, 2),
  D: (date) => String(date.day),
};

/** Pattern tokens a time fills, as in dayjs `format`. `S` is tenths, `SS` hundredths, `SSS` milliseconds. */
const timeTokens: Partial<Record<string, (time: Temporal.PlainTime) => string>> = {
  HH: (time) => pad(time.hour, 2),
  H: (time) => String(time.hour),
  hh: (time) => pad(time.hour % 12 || 12, 2),
  h: (time) => String(time.hour % 12 || 12),
  A: (time) => (time.hour < 12 ? "AM" : "PM"),
  a: (time) => (time.hour < 12 ? "am" : "pm"),
  mm: (time) => pad(time.minute, 2),
  m: (time) => String(time.minute),
  ss: (time) => pad(time.second, 2),
  s: (time) => String(time.second),
  SSS: (time) => pad(time.millisecond, 3),
  SS: (time) => pad(Math.floor(time.millisecond / 10), 2),
  S: (time) => String(Math.floor(time.millisecond / 100)),
};

/**
 * `value` by a token `pattern`. See `Display["format"]`.
 *
 * @throws {TypeError} if `value` is an `Instant`.
 * @throws {RangeError} if `value` is a `PlainDate` and `pattern` has a time.
 */
function formatPattern(value: SupportedTemporalType, pattern: string): string {
  if (value instanceof Temporal.Instant)
    throw new TypeError("Chronos: an Instant has no wall clock to format; convert it first");

  const isDate = value instanceof Temporal.PlainDate;
  const date = isDate ? value : value.toPlainDate();
  const time = isDate ? undefined : value.toPlainTime();

  return Array.from(pattern.matchAll(tokenizer), ([part, literal]) => {
    if (literal !== undefined) return literal;

    const dateToken = dateTokens[part];
    if (dateToken !== undefined) return dateToken(date);

    const timeToken = timeTokens[part];
    if (timeToken === undefined) return part;

    if (time === undefined)
      throw new RangeError(`Chronos: pattern ${pattern} has a time, which a PlainDate lacks`);

    return timeToken(time);
  }).join("");
}

type RelativeUnit = "second" | "minute" | "hour" | "day" | "month" | "year";

/**
 * dayjs's `relativeTime` thresholds, in order: the first row whose rounded
 * difference `in` its unit is at most `max` decides. It says that many of its
 * unit, or `say` instead: 45 to 89 seconds are one minute.
 */
const thresholds: { in: RelativeUnit; max: number; say?: [count: number, unit: RelativeUnit] }[] = [
  { in: "second", max: 44, say: [0, "second"] },
  { in: "second", max: 89, say: [1, "minute"] },
  { in: "minute", max: 44 },
  { in: "minute", max: 89, say: [1, "hour"] },
  { in: "hour", max: 21 },
  { in: "hour", max: 35, say: [1, "day"] },
  { in: "day", max: 25 },
  { in: "day", max: 45, say: [1, "month"] },
  { in: "month", max: 10 },
  { in: "month", max: 17, say: [1, "year"] },
  { in: "year", max: Infinity },
];

/** The thresholds a `PlainDate` can reach: it has no clock. */
const dateThresholds = thresholds.filter((row) => !["second", "minute", "hour"].includes(row.in));

/**
 * How far `value` lies from `other`, as text. See `Display["from"]`.
 *
 * @throws {TypeError} if `other` is not of `value`'s type.
 */
function relative(
  value: SupportedTemporalType,
  other: SupportedTemporalType,
  locale: Intl.LocalesArgument = defaultLocale,
): string {
  const direction = Math.sign(compareExact(value, other));
  const total = difference(value, other);
  const rows = value instanceof Temporal.PlainDate ? dateThresholds : thresholds;

  for (const row of rows) {
    const count = Math.round(Math.abs(total(row.in)));
    if (count > row.max) continue;

    const [n, unit] = row.say ?? [count, row.in];
    // "auto" turns 0 into "jetzt" or "heute", but 1 day into "gestern", which dayjs does not say.
    const numeric = n === 0 ? "auto" : "always";
    return new Intl.RelativeTimeFormat(locale, { numeric }).format(
      n === 0 ? 0 : direction * n,
      unit,
    );
  }

  throw new Error("Chronos: unreachable, the last threshold has no max");
}

/**
 * The difference `value` minus `other` in a unit, as a fraction. Plain
 * date-times and instants are counted in UTC, which has no clock changes; a
 * `ZonedDateTime` in its own zone.
 */
function difference(
  value: SupportedTemporalType,
  other: SupportedTemporalType,
): (unit: RelativeUnit) => number {
  if (value instanceof Temporal.PlainDate) {
    const start = other as Temporal.PlainDate;
    const duration = value.since(start);
    return (unit) => duration.total({ unit, relativeTo: start });
  }

  // `relative` checked `other` is of `value`'s type, so not a `PlainDate` either.
  const timeZone = value instanceof Temporal.ZonedDateTime ? value.timeZoneId : defaultTimeZone;
  const start = toZoned(other as typeof value, timeZone);
  const duration = toZoned(value, timeZone).since(start);
  return (unit) => duration.total({ unit, relativeTo: start });
}

/** `value` as a `ZonedDateTime` in `timeZone`; a plain date-time is read as wall clock there. */
function toZoned(
  value: Exclude<SupportedTemporalType, Temporal.PlainDate>,
  timeZone: string,
): Temporal.ZonedDateTime {
  if (value instanceof Temporal.ZonedDateTime) return value.withTimeZone(timeZone);
  if (value instanceof Temporal.PlainDateTime) return value.toZonedDateTime(timeZone);
  return value.toZonedDateTimeISO(timeZone);
}

/** Now, as a value of `value`'s type: in its zone on a `ZonedDateTime`, otherwise in UTC. */
function now(value: SupportedTemporalType): SupportedTemporalType {
  if (value instanceof Temporal.PlainDate) return Temporal.Now.plainDateISO(defaultTimeZone);
  if (value instanceof Temporal.PlainDateTime)
    return Temporal.Now.plainDateTimeISO(defaultTimeZone);
  if (value instanceof Temporal.ZonedDateTime)
    return Temporal.Now.zonedDateTimeISO(value.timeZoneId);
  return Temporal.Now.instant();
}
