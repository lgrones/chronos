# Chronos — plan

Method-style helpers over the Temporal API, so a project can drop dayjs without
dropping the left-to-right reading of `dayjs(a).isBefore(b)`.

Temporal stays the one date type. `Chronos(x)` is a view that lives for one
expression — an extension method with the `this` spelled out:

```ts
Chronos(today).isBefore(deadline);
Chronos(today).startOf("week").add({ days: 2 });
```

## Contract

1. Only the receiver is wrapped. Arguments are raw Temporal values:
   `Chronos(a).isBefore(b)`, never `Chronos(a).isBefore(Chronos(b))`.
2. Anything that yields a date yields raw Temporal, never a `Chronos`, so the
   native chain (`.with`, `.add`, `.toString`) carries on.
3. No strings or epoch numbers stand in for dates. Parse first, then call.
4. `Chronos` never appears in a signature, a prop, stored state or JSON.
5. No built-in prototype is touched.

Break 2 or 4 and the wrapper escapes its expression — that is dayjs again.

## v1 scope

Port from dayjs what Temporal cannot do in one readable step; leave the rest to
Temporal. Grouped as the dayjs docs group them.

| Feature        | Methods                                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| **query**      | `isBefore`, `isAfter`, `isSame`, `isSameOrBefore`, `isSameOrAfter`, `isBetween` — all with an optional unit |
| **manipulate** | `clamp(min, max)`, `startOf(unit)`, `endOf(unit)`                                                           |
| **range**      | `overlaps`, `isInside` — for a start–end pair; shape open, see below                                        |
| **parse**      | `Chronos.parse` — non-ISO input into a chosen Temporal type, optional dayjs-style format                    |
| **statics**    | A shorter `Temporal.Now` — naming open, see below                                                           |
| **display**    | Something around `Intl` (`format`, `fromNow`). Last; shape undecided.                                       |

`PlainTime` and `PlainYearMonth` wait until something needs them.

### Left to Temporal

- `add` / `subtract`: `d.add({ days: 3 })` reads almost the same as
  `add(3, "days")`; a wrapper would save nothing.
- `isLeapYear`: `d.inLeapYear`.
- `isDayjs`: no equivalent; there is no wrapper type to test for.
- ISO parsing: `Temporal.PlainDate.from("2026-10-06")`.

### Units

The comparisons and `startOf` / `endOf` share one unit set, singular only:
`year | month | week | day | hour | minute | second | millisecond`.

- `PlainDate`: `year | month | week | day`.
- `PlainDateTime`, `ZonedDateTime`: all of them.
- `Instant`: `hour | minute | second | millisecond` — it has no calendar.

A unit comparison compares `startOf(unit)` of both sides, as dayjs does:
`Chronos(a).isSame(b, "month")` is true for any two days in October 2026.
Signatures follow dayjs where an options object would not read worse:
`isSame(other, unit?)`, `isBetween(from, to, { inclusive?, unit? })`.

### Ranges

Check whether one span of time overlaps or lies inside another: a booking
against opening hours, a trip against a season.

"Range", not "duration": a `Temporal.Duration` is an unanchored length ("3 days")
with no start or end, so it cannot overlap anything. Temporal has no type for a
start–end span, and Chronos adds none (rules 2 and 4): a range is a plain pair of
Temporal values of the same type.

Sketch:

```ts
const booking = [checkIn, checkOut] as const; // or { start, end }
const season = [seasonStart, seasonEnd] as const;

Chronos(booking).overlaps(season); // any shared moment
Chronos(booking).isInside(season); // booking lies entirely within season
```

To settle before building it:

- **Shape.** A tuple `[start, end]` or `{ start, end }`. The object is clearer in
  stored state and JSON; the tuple is shorter inline.
- **Endpoints.** Half-open `[start, end)` by default, so 09:00–10:00 and
  10:00–11:00 do not overlap and back-to-back bookings work. Inclusive as an
  option, as with `isBetween`.
- **Units.** Whether `overlaps(other, "day")` is worth having, by the same
  `startOf` rule as the comparisons.
- **Reversed or empty ranges.** Throw on `end` before `start`, as `clamp` does;
  decide whether `start === end` is an empty range or a single moment.
- **Receiver overload.** `Chronos(range)` adds overloads for pairs of each type;
  check the types still reject a mixed pair (`[PlainDate, ZonedDateTime]`).

### `parse`

Sketch, to settle when milestone 2 starts:

```ts
Chronos.parse("06.10.2026", Temporal.PlainDate); // default format per type, de-AT
Chronos.parse("6.10.26 14:30", Temporal.PlainDateTime, "D.M.YY HH:mm");
Chronos.parse("06.10.2026 14:30", Temporal.ZonedDateTime, {
  format: "DD.MM.YYYY HH:mm",
  timeZone: "Europe/Vienna",
});
```

Tokens follow dayjs `customParseFormat`. Matching is strict: input that does
not fit the format throws, and so does a date that does not exist (31.02.).

## Decisions to settle first

- **Dispatch**: explicit `instanceof` per type behind one TS overload per type.
  Not `value.constructor.compare` — harder to type, and it hides a
  `PlainDate`-vs-`ZonedDateTime` mistake.
- **`isSame` on `ZonedDateTime`**: same instant (`compare === 0`), not
  `.equals` (instant, zone and calendar). Matches dayjs, whose `isSame`
  compares epoch milliseconds and ignores the zone. Trial decision — revisit
  once a consumer has used it.
- **Week start**: Monday (ISO, matches de-AT). Configurable only once a market
  needs Sunday.
- **Locale**: `format` and `fromNow` default to `de-AT` with an optional
  `locale` argument. No global mutable config.
- **`endOf`**: the last representable value of the period, not the start of the
  next one — down to the nanosecond, since Temporal has them.
- **`Instant` units**: `startOf("hour")` on an `Instant` floors in UTC. Fine for
  minutes and below; for hours it differs from local time in zones with a
  non-whole-hour offset (India, +05:30). Revisit if anyone compares instants by
  the hour.

## Polyfill and types

- Node 26 and Chrome/Edge 144+ and Firefox 139+ ship Temporal. Safari does not
  yet, so consumers load `temporal-polyfill/global` until it does.
- The library never bundles or imports a polyfill; it uses the global
  `Temporal`. Importing a polyfill's classes beside native ones breaks
  `instanceof` silently.
- Types come from TypeScript 7's `esnext.temporal` lib — no polyfill types.

## Stack

Vite+ (`vp`): `vp pack` (tsdown), `vp test` (Vitest), `vp check` (Oxlint
type-aware, Oxfmt, type check). ESM only, `sideEffects: false`, no runtime
dependencies.

## Tests

- The suite runs on native Temporal (Node 26) and again against the polyfill.
- Edge cases: DST changeover for `startOf("day")` on `ZonedDateTime`; week
  boundaries across a year; unit comparisons at a boundary (23:59:59.999 vs
  00:00 the next day); `isBetween` inclusive and exclusive, either bound order;
  `parse` rejecting 31.02. and input that does not fit the format; ranges that
  touch at one end, share a boundary, or nest exactly.
- Type-level tests with `@ts-expect-error`: cross-type comparison, a string
  argument, a `Chronos` passed as an argument, a calendar unit on `Instant`, a
  time unit on `PlainDate`.

## Milestones

1. Query and manipulate: `startOf`/`endOf`, then the comparisons with units on
   top of them, and `clamp`. Tested on native and polyfill.
2. Ranges: settle the shape, then `overlaps` and `isInside`.
3. `parse`.
4. Display — settle what it is first.
5. Move one real project off dayjs, write down what was missing, cut 1.0.

## Open

- **Name.** Chronos sounds right; `chronos` on npm is likely taken, so a scoped
  name. Alternatives: Kairos, Tempo.
- **Publishing.** npm public or GitHub Packages. `private: true` until decided.
- **First consumer** for milestone 4.
- **Current-time statics.** Agreed: `Temporal.Now.plainDateISO()` is clunky
  enough to wrap. Open: the names.
  - `Chronos.today()` / `Chronos.now()`: short, but `now()` hides that it is a
    `ZonedDateTime`; you have to know.
  - `Chronos.plainDateNow()`, `Chronos.zonedDateTimeNow()`, …: say the type, as
    C#'s `DateOnly.Today` / `DateTimeOffset.Now` do, but come close to renaming
    `Temporal.Now` one-for-one.
  - Whatever the name, a zoned "now" over a `PlainDateTime` one: C#'s
    `DateTime.Now` drops the offset and gets DST arithmetic wrong.
