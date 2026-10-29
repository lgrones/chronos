# Display

The receiver as text: by a token pattern, by `Intl` options, or relative to
another moment. Text is in `de-AT` unless you name a locale.

## format

`format` takes either a token pattern or `Intl.DateTimeFormat` options.

### By pattern

```ts
format(pattern: string): string
```

The receiver by a Day.js-style pattern. The tokens are those of
[`Chronos.parse`](/api/parse#tokens), so text formatted by a pattern parses back
by the same pattern. Literal text goes in `[brackets]`.

```ts
const now = Temporal.PlainDateTime.from("2026-10-06T14:35:12");

Chronos(now).format("DD.MM.YYYY HH:mm"); // "06.10.2026 14:35"
Chronos(now).format("[Am] D.M.YY [um] h:mm a"); // "Am 6.10.26 um 2:35 pm"
```

A `PlainDate` has no time, so a pattern with time tokens throws a `RangeError`.
An `Instant` has no wall clock and takes no pattern; convert it with
`toZonedDateTimeISO` first.

### By `Intl` options

```ts
format(options?: Intl.DateTimeFormatOptions, locale?: Intl.LocalesArgument): string
```

The receiver by `Intl.DateTimeFormat` options, in `locale`, `de-AT` by default.

```ts
const today = Temporal.PlainDate.from("2026-10-06");

Chronos(today).format(); // "6.10.2026"
Chronos(today).format({ dateStyle: "full" }); // "Dienstag, 6. Oktober 2026"
Chronos(today).format({ dateStyle: "long" }, "en-GB"); // "6 October 2026"
```

An `Instant` is shown in UTC unless `options.timeZone` says otherwise, so the
output does not depend on the machine's zone:

```ts
const instant = Temporal.Instant.from("2026-10-06T07:00Z");

Chronos(instant).format({ timeStyle: "short" }); // "07:00"
Chronos(instant).format({ timeStyle: "short", timeZone: "Europe/Vienna" }); // "09:00"
```

## from

```ts
from(other: T, locale?: Intl.LocalesArgument): string
```

How far the receiver lies from `other`, in `locale`, `de-AT` by default.

```ts
const today = Temporal.PlainDate.from("2026-10-06");

Chronos(today).from(Temporal.PlainDate.from("2026-10-09")); // "vor 3 Tagen"
Chronos(Temporal.PlainDate.from("2026-10-20")).from(today); // "in 14 Tagen"
Chronos(today).from(today); // "heute"
Chronos(today).from(today, "en"); // "today"
```

The unit and rounding follow Day.js's `relativeTime`. The difference is rounded
in each unit in turn, and the first row it fits decides:

| Difference       | Says                              |
| ---------------- | --------------------------------- |
| 0 to 44 seconds  | "jetzt"; "heute" on a `PlainDate` |
| 45 to 89 seconds | 1 minute                          |
| 2 to 44 minutes  | minutes                           |
| 45 to 89 minutes | 1 hour                            |
| 2 to 21 hours    | hours                             |
| 22 to 35 hours   | 1 day                             |
| 2 to 25 days     | days                              |
| 26 to 45 days    | 1 month                           |
| 2 to 10 months   | months                            |
| 11 to 17 months  | 1 year                            |
| more             | years                             |

On a `ZonedDateTime`, the receiver's zone decides where days, months and years
start. A `PlainDateTime` or `Instant` counts them in UTC.

## fromNow

```ts
fromNow(locale?: Intl.LocalesArgument): string
```

How far the receiver lies from now, as [`from`](#from). Now is read in the
receiver's zone on a `ZonedDateTime`, otherwise in UTC.

```ts
Chronos(today).fromNow(); // "vor 3 Tagen"
```

## Errors

`format` throws a `RangeError` if a `PlainDate` pattern has a time. `from`
throws a `TypeError` if `other` is not of the receiver's type.
