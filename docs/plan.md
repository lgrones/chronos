# Chronos — plan

Method-style helpers over the Temporal API, so a project can drop dayjs without
dropping the left-to-right reading of `dayjs(a).isBefore(b)`.

Temporal stays the one date type. `Chronos(x)` is a view that lives for one
expression — an extension method with the `this` spelled out:

```ts
Chronos(today).isBefore(deadline);
Chronos(today).add(3, "days").with({ day: 1 });
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

| Receiver                                                 | Methods                                                                                  |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| every comparable type                                    | `isBefore`, `isAfter`, `isSame`, `isBetween(from, to, { inclusive })`, `clamp(min, max)` |
| `PlainDate`, `PlainDateTime`, `ZonedDateTime`, `Instant` | `add(amount, unit)`, `subtract(amount, unit)`                                            |
| `PlainDate`, `PlainDateTime`, `ZonedDateTime`            | `startOf(unit)`, `endOf(unit)` — `day \| week \| month \| year`; `format(preset)`        |
| `ZonedDateTime`, `Instant`                               | `fromNow()` through `Intl.RelativeTimeFormat`                                            |
| statics                                                  | `Chronos.today()`, `Chronos.now()`, `Chronos.parseDate("06.10.2026")`                    |

`PlainTime` and `PlainYearMonth` wait until something needs them.

### `add` / `subtract`

`Chronos(d).add(3, "days")` reads better than `d.add({ days: 3 })`. Units take
the singular or plural, so `add(1, "day")` and `add(3, "days")` both read
naturally. The unit type depends on the receiver:

- `PlainDate`: `year(s) | month(s) | week(s) | day(s)`
- `PlainDateTime`, `ZonedDateTime`: those plus `hour(s) | minute(s) | second(s) | millisecond(s)`
- `Instant`: time units only — Temporal refuses calendar units on an `Instant`,
  so the types refuse them too

Both return raw Temporal (rule 2). They map onto the native
`add({ [plural]: amount })`, so overflow follows Temporal: 31 Jan + 1 month is
28/29 Feb, not 3 Mar.

## Decisions to settle first

- **Dispatch**: explicit `instanceof` per type behind one TS overload per type.
  Not `value.constructor.compare` — harder to type, and it hides a
  `PlainDate`-vs-`ZonedDateTime` mistake.
- **`isSame` on `ZonedDateTime`**: same instant (`compare === 0`) or same
  instant, zone and calendar (`.equals`). Leaning same instant; document it.
- **Week start**: Monday (ISO, matches de-AT). Configurable only once a market
  needs Sunday.
- **Locale**: `format` and `fromNow` default to `de-AT` with an optional
  `locale` argument. No global mutable config.
- **`endOf`**: the last representable value of the period, not the start of the
  next one.

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
- Edge cases: DST changeover for `startOf("day")` on `ZonedDateTime`; month-end
  overflow in `add`; week boundaries across a year; `isBetween` both ways
  inclusive; singular and plural units giving the same result.
- Type-level tests with `@ts-expect-error`: cross-type comparison, a string
  argument, a `Chronos` passed as an argument, a calendar unit on `Instant`, a
  time unit on `PlainDate`.

## Milestones

1. Comparison and `add`/`subtract`, tested on native and polyfill.
2. `startOf`/`endOf` and the format presets.
3. `fromNow` and `parseDate`.
4. Move one real project off dayjs, write down what was missing, cut 1.0.

## Open

- **Name.** Chronos sounds right; `chronos` on npm is likely taken, so a scoped
  name. Alternatives: Kairos, Tempo.
- **Publishing.** npm public or GitHub Packages. `private: true` until decided.
- **First consumer** for milestone 4.
