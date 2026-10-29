# Parse

`Chronos.parse` reads a string into the Temporal type you name, by a
Day.js-style format:

```ts
Chronos.parse("06.10.2026", Temporal.PlainDate, "DD.MM.YYYY"); // 2026-10-06
```

```ts
Chronos.parse(input: string, type: typeof Temporal.PlainDate, format?: string): Temporal.PlainDate
Chronos.parse(input: string, type: typeof Temporal.PlainDateTime, format?: string): Temporal.PlainDateTime
Chronos.parse(input: string, type: typeof Temporal.ZonedDateTime, options: ZonedParseOptions): Temporal.ZonedDateTime
Chronos.parse(input: string, type: typeof Temporal.Instant, options: ZonedParseOptions): Temporal.Instant
```

## Default format

Without a format, `input` is ISO 8601: `YYYY-MM-DD` for a date,
`YYYY-MM-DDTHH:mm` with a time. That is stricter than the type's own `from`,
which also takes seconds, offsets and annotations, and drops a time it has no
field for.

```ts
Chronos.parse("2026-10-06", Temporal.PlainDate); // 2026-10-06
Chronos.parse("2026-10-06T10:00", Temporal.PlainDate); // throws RangeError
```

## Zoned types

A `ZonedDateTime` or `Instant` needs a time zone to read the wall-clock time
in. Pass options instead of a format:

| Option     | Type     | Meaning                                                    |
| ---------- | -------- | ---------------------------------------------------------- |
| `timeZone` | `string` | Required. The IANA zone, such as `Europe/Vienna`           |
| `format`   | `string` | The format `input` follows. Defaults to `YYYY-MM-DDTHH:mm` |

```ts
Chronos.parse("06.10.2026 14:30", Temporal.ZonedDateTime, {
  format: "DD.MM.YYYY HH:mm",
  timeZone: "Europe/Vienna",
}); // 2026-10-06T14:30:00+02:00[Europe/Vienna]

Chronos.parse("2026-10-06T14:30", Temporal.Instant, { timeZone: "Europe/Vienna" });
// 2026-10-06T12:30:00Z
```

## Tokens

Tokens follow Day.js `customParseFormat`. [`format`](/api/display#format) uses
the same tokens, so text formatted by a pattern parses back by the same pattern.

| Token  | Matches                                              | Example     |
| ------ | ---------------------------------------------------- | ----------- |
| `YYYY` | Four-digit year                                      | `2026`      |
| `YY`   | Two-digit year: 69–99 are the 1900s, 00–68 the 2000s | `26`        |
| `MM`   | Month, two digits                                    | `01`–`12`   |
| `M`    | Month, one or two digits                             | `1`–`12`    |
| `DD`   | Day, two digits                                      | `01`–`31`   |
| `D`    | Day, one or two digits                               | `1`–`31`    |
| `HH`   | Hour, 24-hour clock, two digits                      | `00`–`23`   |
| `H`    | Hour, 24-hour clock, one or two digits               | `0`–`23`    |
| `hh`   | Hour, 12-hour clock, two digits                      | `01`–`12`   |
| `h`    | Hour, 12-hour clock, one or two digits               | `1`–`12`    |
| `A`    | Upper-case meridiem                                  | `AM`, `PM`  |
| `a`    | Lower-case meridiem                                  | `am`, `pm`  |
| `mm`   | Minute, two digits                                   | `00`–`59`   |
| `m`    | Minute, one or two digits                            | `0`–`59`    |
| `ss`   | Second, two digits                                   | `00`–`59`   |
| `s`    | Second, one or two digits                            | `0`–`59`    |
| `SSS`  | Milliseconds                                         | `000`–`999` |
| `SS`   | Hundredths of a second                               | `00`–`99`   |
| `S`    | Tenths of a second                                   | `0`–`9`     |

Literal text goes in `[brackets]`. Every other character matches itself.

```ts
Chronos.parse("Am 06.10.2026", Temporal.PlainDate, "[Am] DD.MM.YYYY"); // 2026-10-06
Chronos.parse("06.10.2026 2:30 PM", Temporal.PlainDateTime, "DD.MM.YYYY h:mm A");
// 2026-10-06T14:30:00
```

A format needs a year, month and day. Time fields it leaves out are 0, and `h`
without `A` or `a` is before noon, as in Day.js.

## Strict matching

Input that does not fit the format throws, and so does a date or time that does
not exist, such as 31.02. or 02:30 on the night the clocks go forward. A time
that exists twice, when they go back, is the earlier one.

```ts
Chronos.parse("31.02.2026", Temporal.PlainDate, "DD.MM.YYYY"); // throws RangeError
Chronos.parse("2026-03-29T02:30", Temporal.ZonedDateTime, { timeZone: "Europe/Vienna" });
// throws RangeError: 2026-03-29T02:30:00 does not exist in Europe/Vienna
```

## Errors

| Error        | When                                                                                                              |
| ------------ | ----------------------------------------------------------------------------------------------------------------- |
| `RangeError` | `input` does not fit the format, or names a date or time that does not exist, or a `PlainDate` format has a time  |
| `TypeError`  | `type` is not a supported Temporal type, a zoned type has no `timeZone`, or the format lacks a year, month or day |
