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
| **range**      | `Chronos.range(a, b)`: `overlaps`, `isBetween` — for a start–end pair, see below                            |
| **parse**      | `Chronos.parse` — input into a chosen Temporal type, by a dayjs-style format; strict ISO by default         |
| **statics**    | A shorter `Temporal.Now` — naming open, see below                                                           |
| **display**    | `format` by pattern or `Intl` options, `from` / `fromNow` — see below                                       |

`PlainTime` and `PlainYearMonth` wait until something needs them.

### Left to Temporal

- `add` / `subtract`: `d.add({ days: 3 })` reads almost the same as
  `add(3, "days")`; a wrapper would save nothing.
- `isLeapYear`: `d.inLeapYear`.
- `isDayjs`: no equivalent; there is no wrapper type to test for.
- Lenient ISO parsing: `Temporal.PlainDate.from("2026-10-06")`.

### Units

The comparisons and `startOf` / `endOf` share one unit set:
`year | month | week | day | hour | minute | second | millisecond`, each also by
its plural and the aliases in `src/shared/units.ts` (`d`, `M`, `secs`, …).
Aliases are ours to add, not the user's: adding one is a line in that table,
and the types and runtime lookup follow. Case-sensitive, as in dayjs: `M` is
month, `m` minute.

- `PlainDate`: `year | month | week | day`.
- `PlainDateTime`, `ZonedDateTime`: all of them.
- `Instant`: `hour | minute | second | millisecond` — it has no calendar.

With a unit, the receiver stands for its whole unit, as in dayjs: `isSame`
checks `b` lies between `startOf(unit)` and `endOf(unit)` of `a`, `isBefore`
that `endOf(unit)` is before `b`. `Chronos(a).isSame(b, "month")` is true for
any two days in October 2026. On a `ZonedDateTime` the receiver's zone decides
where the unit starts and ends.
Signatures follow dayjs where an options object would not read worse:
`isSame(other, unit?)`,
`isBetween(from, to, { inclusive?, includeStart?, includeEnd?, unit? })`.

### Ranges

Check whether one span of time overlaps or lies inside another: a booking
against opening hours, a trip against a season.

"Range", not "duration": a `Temporal.Duration` is an unanchored length ("3 days")
with no start or end, so it cannot overlap anything. Temporal has no type for a
start–end span, and Chronos adds none (rules 2 and 4): a range is a plain pair of
Temporal values of the same type.

```ts
Chronos.range(checkIn, checkOut).overlaps(opens, closes); // any shared moment
Chronos.range(checkIn, checkOut).isBetween(seasonStart, seasonEnd); // within the season
```

- **Receiver.** `Chronos.range(a, b)` is a view for one expression, like
  `Chronos(value)`. The other range is passed as two raw values, so there is no
  range shape to store; callers keep `{ start, end }` or a tuple as they like.
  One overload per type, so a mixed pair is rejected.
- **Order.** Both ranges are sorted first; a reversed range never throws.
- **Endpoints.** The same options as `isBetween` on a value: bounds are
  excluded by default, `inclusive` includes both, `includeStart` and
  `includeEnd` override it for one. Excluded by default, 09:00–10:00 and
  10:00–11:00 do not overlap, so back-to-back bookings work.
- **Equal ends.** A range from `t` to `t` is the moment `t` and behaves as
  `Chronos(t)`: every range check reduces to the value check for it.
- **Units.** Each comparison takes the unit as the value comparisons do. An
  excluded bound excludes its whole unit, so two ranges on one day overlap by
  `"day"` only with `inclusive`, as dayjs's `isBetween` with a unit.

### `parse`

Input into a chosen Temporal type, by a format.

```ts
Chronos.parse("2026-10-06", Temporal.PlainDate); // strict ISO by default
Chronos.parse("6.10.26 14:30", Temporal.PlainDateTime, "D.M.YY HH:mm");
Chronos.parse("06.10.2026 14:30", Temporal.ZonedDateTime, {
  format: "DD.MM.YYYY HH:mm",
  timeZone: "Europe/Vienna",
});
```

- **Defaults.** ISO 8601, not a locale: `YYYY-MM-DD` for `PlainDate`,
  `YYYY-MM-DDTHH:mm` for the rest. Stricter than `from`, which also takes
  seconds, offsets and annotations, and drops a time `PlainDate` has no field
  for. Parsing user input in a locale's format means passing that format.
- **Tokens.** dayjs `customParseFormat`, literal text in `[brackets]`:
  `YYYY YY M MM D DD H HH h hh A a m mm s ss S SS SSS`. `YY` pivots as dayjs:
  69–99 are the 1900s. `D` takes one or two digits, `DD` exactly two. Month names (`MMM`, `MMMM`) and offsets (`Z`, `ZZ`) wait until
  something needs them.
- **Required fields.** A format needs a year, month and day; no field defaults
  to today, which would hide a `now` in a parse. Time fields left out are 0. A
  `PlainDate` format with a time field throws. `h` without `A`/`a` is before
  noon, as in dayjs.
- **Zones.** `ZonedDateTime` and `Instant` need a `timeZone`; the input is wall
  clock in that zone. A time in the spring-forward gap throws, a time that
  exists twice in autumn is the earlier one (Temporal's `compatible`).
- **Strict.** Input that does not fit the format throws, including surrounding
  whitespace; so does a date or time that does not exist (31.02., 24:00).
- **Reading.** Left to right, as dayjs: a literal must come next, a token's
  pattern must match there. No backtracking, so a format without separators
  (`DMYYYY`) only works with fixed-width tokens. Range checks are Temporal's
  (`overflow: "reject"`).

### Display

The receiver as text, by a pattern, by `Intl` options, or relative to another
moment.

```ts
Chronos(start).format("DD.MM.YYYY HH:mm"); // "06.10.2026 14:30"
Chronos(start).format({ dateStyle: "long" }); // "6. Oktober 2026"
Chronos(start).from(end); // "vor 3 Tagen"
Chronos(deadline).fromNow("en"); // "in 2 hours"
```

- **Pattern.** The tokens of `parse`, so a pattern formats and parses back the
  same. A `PlainDate` pattern with a time throws. An `Instant` takes none: it
  has no wall clock, convert it with `toZonedDateTimeISO` first.
- **Intl.** An options object goes to `toLocaleString`, in `de-AT` unless a
  `locale` is passed.
- **Relative.** dayjs's `relativeTime` thresholds pick unit and count (45
  seconds is a minute, 22 hours a day, 26 days a month); `Intl.RelativeTimeFormat`
  writes it. Under 45 seconds is "jetzt", a `PlainDate` on the same day "heute";
  otherwise numbers, so one day is "vor 1 Tag", not "gestern", as in dayjs.
  `from` takes the reference; `fromNow` reads `Temporal.Now`.
- **Time zone.** UTC wherever none is given: an `Instant` in `format` without
  `options.timeZone`, now for a `PlainDate` or `PlainDateTime` in `fromNow`, and
  where an `Instant` or `PlainDateTime` counts days and months. A
  `ZonedDateTime` keeps its own zone, the receiver's deciding.

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
- **Locale**: `format`, `from` and `fromNow` default to `de-AT` with an
  optional `locale` argument. No global mutable config.
- **Time zone**: UTC where a value has none and the caller names none, never
  the machine's zone.
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
  touch at one end, share a boundary, nest exactly, or have equal ends.
- Type-level tests with `@ts-expect-error`: cross-type comparison, a string
  argument, a `Chronos` passed as an argument, a calendar unit on `Instant`, a
  time unit on `PlainDate`.

## Milestones

1. Query and manipulate: `startOf`/`endOf`, then the comparisons with units on
   top of them, and `clamp`. Tested on native and polyfill.
2. Ranges: `Chronos.range(a, b)` with `overlaps` and `isBetween`.
3. `parse`.
4. Display: `format`, `from`, `fromNow`.
5. Move one real project off dayjs, write down what was missing, cut 1.0.

## Open

- **First consumer** for milestone 5.
- **Current-time statics.** Agreed: `Temporal.Now.plainDateISO()` is clunky
  enough to wrap. Open: the names.
  - `Chronos.today()` / `Chronos.now()`: short, but `now()` hides that it is a
    `ZonedDateTime`; you have to know.
  - `Chronos.plainDateNow()`, `Chronos.zonedDateTimeNow()`, …: say the type, as
    C#'s `DateOnly.Today` / `DateTimeOffset.Now` do, but come close to renaming
    `Temporal.Now` one-for-one.
  - Whatever the name, a zoned "now" over a `PlainDateTime` one: C#'s
    `DateTime.Now` drops the offset and gets DST arithmetic wrong.
