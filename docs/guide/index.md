# Getting started

Temporal fixes JavaScript dates: separate types for dates, time and an instant,
real time zones, immutability. What it lacks is the Day.js reading order.
`dayjs(a).isBefore(b)` reads like a sentence; `Temporal.PlainDate.compare(a, b) < 0`
does not. Chronos wraps the receiver so methods read left to right:

```ts
import { Chronos } from "chronos-temporal";

const today = Temporal.Now.plainDateISO();

Chronos(today).isBefore(deadline); // deadline is a plain Temporal.PlainDate
Chronos(today).isSame(deadline, "month");
Chronos(today).isBetween(start, end, { inclusive: true });

Chronos(today).startOf("month").add({ days: 14 }); // returns Temporal: the native chain continues

const date = Chronos.parse("06.10.2026", Temporal.PlainDate, "DD.MM.YYYY");
Chronos(date).format("DD.MM.YYYY"); // same tokens as parse
Chronos(date).fromNow(); // "vor 3 Tagen"; de-AT unless given a locale
```

**Chronos is not a date library, and does not want to become one.** Where
Temporal already reads well, Chronos stays out of the way: `add`, `subtract`
and ISO parsing are plain Temporal.

## Install

Chronos is not on npm yet. Until it is, copy what you need: every helper is a
few lines over a native Temporal call, in
[`src/`](https://github.com/lgrones/chronos/tree/master/src).

## Requirements

A global `Temporal`. Node 26, Chrome and Edge 144+ and Firefox 139+ ship it.
Safari does not yet. Until it does, load a polyfill once at your entry point:

```ts
import "temporal-polyfill/global";
```

## Supported types

`Chronos(value)` takes one of four Temporal types. Methods and units follow the
receiver's type, and arguments must be of the same type:

| Type            | Units                   | Notes                                        |
| --------------- | ----------------------- | -------------------------------------------- |
| `PlainDate`     | calendar units          | No clock: `format` patterns take no time     |
| `PlainDateTime` | calendar and time units |                                              |
| `ZonedDateTime` | calendar and time units | Its zone decides where days and months start |
| `Instant`       | time units              | No calendar; counted in UTC                  |

Any other value throws a `TypeError`. See [Units and types](/api/types) for the
unit names and aliases.

## The contract

`Chronos(x)` lives for one expression. These rules keep it from becoming Day.js:

1. Only the receiver is wrapped. Arguments are raw Temporal values:
   `Chronos(a).isBefore(b)`, never `Chronos(a).isBefore(Chronos(b))`.
2. Anything that yields a date yields raw Temporal, never a `Chronos`.
3. No strings or epoch numbers stand in for dates. Parse first, then call.
4. `Chronos` never appears in a signature, a prop, stored state or JSON.
5. No built-in prototype is touched.

Removing Chronos from a project should mean rewriting call sites, never data
flow.

## What is left to Temporal

| Day.js                 | Temporal                                |
| ---------------------- | --------------------------------------- |
| `add(3, "days")`       | `date.add({ days: 3 })`                 |
| `subtract(1, "month")` | `date.subtract({ months: 1 })`          |
| `isLeapYear()`         | `date.inLeapYear`                       |
| `dayjs("2026-10-06")`  | `Temporal.PlainDate.from("2026-10-06")` |

For helpers Temporal lacks and Chronos leaves out, such as `diffDays`,
rounding or `withDayOfWeek`, see
[temporal-utils](https://www.npmjs.com/package/temporal-utils), from the
author of `temporal-polyfill`.
