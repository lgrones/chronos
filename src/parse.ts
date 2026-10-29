import { tokenizer } from "./shared/tokens.ts";

/** Options for parsing into a type that needs a time zone. */
export interface ZonedParseOptions {
  /** The format `input` follows. Defaults to `YYYY-MM-DDTHH:mm`. */
  format?: string;
  /** The IANA time zone the wall-clock time in `input` is read in, e.g. `Europe/Vienna`. */
  timeZone: string;
}

/**
 * Parses `input` into the Temporal type `type`, by a dayjs-style `format`:
 * `Chronos.parse("06.10.2026", Temporal.PlainDate, "DD.MM.YYYY")`.
 *
 * Without a format, `input` is ISO 8601: `YYYY-MM-DD` for a date,
 * `YYYY-MM-DDTHH:mm` with a time. Stricter than the type's own `from`, which
 * also takes seconds, offsets and annotations, and drops a time it has no
 * field for.
 *
 * Tokens follow dayjs `customParseFormat`: `YYYY YY M MM D DD H HH h hh A a m mm
 * s ss S SS SSS`, with literal text in `[brackets]`. Every other character
 * matches itself. A format needs a year, month and day; time fields it leaves
 * out are 0, and `h` without `A` or `a` is before noon, as in dayjs.
 *
 * Matching is strict: input that does not fit the format throws, and so does a
 * date or time that does not exist, such as 31.02. or 02:30 on the night the
 * clocks go forward. A time that exists twice, when they go back, is the
 * earlier one.
 *
 * @throws {RangeError} if `input` does not fit the format, or names a date or
 * time that does not exist, or a `PlainDate` format has a time.
 * @throws {TypeError} if `type` is not a supported Temporal type, a zoned type
 * has no `timeZone`, or the format lacks a year, month or day.
 */
export interface Parse {
  (input: string, type: typeof Temporal.PlainDate, format?: string): Temporal.PlainDate;
  (input: string, type: typeof Temporal.PlainDateTime, format?: string): Temporal.PlainDateTime;
  (
    input: string,
    type: typeof Temporal.ZonedDateTime,
    options: ZonedParseOptions,
  ): Temporal.ZonedDateTime;
  (input: string, type: typeof Temporal.Instant, options: ZonedParseOptions): Temporal.Instant;
}

type SupportedTemporalClass =
  | typeof Temporal.PlainDate
  | typeof Temporal.PlainDateTime
  | typeof Temporal.ZonedDateTime
  | typeof Temporal.Instant;

/** The date and time `input` spells. */
interface DateTimeFields {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  second?: number;
  millisecond?: number;
}

/** What a format has read so far. A 12-hour time stays before noon until `afternoon` says otherwise. */
type Fields = Partial<DateTimeFields> & { afternoon?: boolean };

/** What a token matches at the start of the input, and how it fills `fields` from the match. */
type Token = [pattern: RegExp, set: (fields: Fields, text: string) => void];

const hour12: Token[1] = (fields, text) => {
  const hour = Number(text);
  if (hour < 1 || hour > 12) throw new RangeError(`Chronos: no hour ${text} on a 12-hour clock`);
  fields.hour = hour % 12;
};

/** `S` is tenths, `SS` hundredths, `SSS` milliseconds. */
const fraction: Token[1] = (fields, text) => (fields.millisecond = Number(text.padEnd(3, "0")));

/** Format tokens as in dayjs `customParseFormat`. `D` takes one or two digits, `DD` exactly two. */
const tokens: Partial<Record<string, Token>> = {
  YYYY: [/^\d{4}/, (fields, text) => (fields.year = Number(text))],
  // dayjs's pivot: 69–99 are the 1900s, 00–68 the 2000s.
  YY: [
    /^\d{2}/,
    (fields, text) => (fields.year = Number(text) + (Number(text) > 68 ? 1900 : 2000)),
  ],
  MM: [/^\d{2}/, (fields, text) => (fields.month = Number(text))],
  M: [/^\d{1,2}/, (fields, text) => (fields.month = Number(text))],
  DD: [/^\d{2}/, (fields, text) => (fields.day = Number(text))],
  D: [/^\d{1,2}/, (fields, text) => (fields.day = Number(text))],
  HH: [/^\d{2}/, (fields, text) => (fields.hour = Number(text))],
  H: [/^\d{1,2}/, (fields, text) => (fields.hour = Number(text))],
  hh: [/^\d{2}/, hour12],
  h: [/^\d{1,2}/, hour12],
  A: [/^(AM|PM)/, (fields, text) => (fields.afternoon = text === "PM")],
  a: [/^(am|pm)/, (fields, text) => (fields.afternoon = text === "pm")],
  mm: [/^\d{2}/, (fields, text) => (fields.minute = Number(text))],
  m: [/^\d{1,2}/, (fields, text) => (fields.minute = Number(text))],
  ss: [/^\d{2}/, (fields, text) => (fields.second = Number(text))],
  s: [/^\d{1,2}/, (fields, text) => (fields.second = Number(text))],
  SSS: [/^\d{3}/, fraction],
  SS: [/^\d{2}/, fraction],
  S: [/^\d/, fraction],
};

/** Parses `input` into `type`. See `Parse`. */
export const parse = ((
  input: string,
  type: SupportedTemporalClass,
  options: string | Partial<ZonedParseOptions> = {},
) => {
  const { format, timeZone }: Partial<ZonedParseOptions> =
    typeof options === "string" ? { format: options } : options;

  if (type === Temporal.PlainDate) {
    const { year, month, day, ...time } = read(input, format ?? "YYYY-MM-DD");
    // `PlainDate.from` ignores time fields, so a time in the format would be dropped silently.
    if (Object.keys(time).length > 0)
      throw new RangeError(`Chronos: format ${format} has a time, which a PlainDate lacks`);

    return Temporal.PlainDate.from({ year, month, day }, { overflow: "reject" });
  }

  const isZoned = type === Temporal.ZonedDateTime || type === Temporal.Instant;
  if (type !== Temporal.PlainDateTime && !isZoned)
    throw new TypeError("Chronos: parse expects a Temporal date type");

  const dateTime = Temporal.PlainDateTime.from(read(input, format ?? "YYYY-MM-DDTHH:mm"), {
    overflow: "reject",
  });

  if (!isZoned) return dateTime;

  if (timeZone === undefined)
    throw new TypeError(`Chronos: parsing into ${type.name} needs a timeZone`);

  const zoned = dateTime.toZonedDateTime(timeZone);
  // A wall-clock time in the gap when the clocks go forward is moved past it.
  if (!zoned.toPlainDateTime().equals(dateTime))
    throw new RangeError(`Chronos: ${dateTime.toString()} does not exist in ${timeZone}`);

  return type === Temporal.Instant ? zoned.toInstant() : zoned;
}) as Parse;

/**
 * The date and time fields `input` spells by `format`, read left to right as
 * dayjs does: a literal must come next in `input`, a token must match there.
 * Values are not range-checked; Temporal rejects out-of-range ones.
 *
 * @throws {RangeError} if `input` does not fit `format`.
 * @throws {TypeError} if `format` lacks a year, month or day.
 */
function read(input: string, format: string): DateTimeFields {
  const fields: Fields = {};
  let rest = input;

  for (const [part, literal] of format.matchAll(tokenizer)) {
    const token = literal === undefined ? tokens[part] : undefined;
    const text = token === undefined ? (literal ?? part) : token[0].exec(rest)?.[0];

    // A token's pattern is anchored, so this only fails for a literal.
    if (text === undefined || !rest.startsWith(text))
      throw new RangeError(`Chronos: ${input} does not fit format ${format}`);

    token?.[1](fields, text);
    rest = rest.slice(text.length);
  }

  if (rest !== "") throw new RangeError(`Chronos: ${input} does not fit format ${format}`);

  const { year, month, day, afternoon, ...time } = fields;

  if (year === undefined || month === undefined || day === undefined)
    throw new TypeError(`Chronos: format ${format} needs a year, month and day`);

  if (afternoon) time.hour = (time.hour ?? 0) + 12;

  return { year, month, day, ...time };
}
