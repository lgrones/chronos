# Units and types

## Units

Comparisons, [`startOf`](/api/manipulate#startof) and
[`endOf`](/api/manipulate#endof) share one set of units. Each also goes by its
plural and the aliases below. Aliases are case-sensitive, as in Day.js: `M` is
month, `m` minute.

| Unit          | Aliases                       | Kind     |
| ------------- | ----------------------------- | -------- |
| `year`        | `years`, `y`                  | calendar |
| `month`       | `months`, `M`                 | calendar |
| `week`        | `weeks`, `w`                  | calendar |
| `day`         | `days`, `d`                   | calendar |
| `hour`        | `hours`, `h`                  | time     |
| `minute`      | `minutes`, `m`, `min`, `mins` | time     |
| `second`      | `seconds`, `s`, `sec`, `secs` | time     |
| `millisecond` | `milliseconds`, `ms`          | time     |

Units follow the receiver:

- `PlainDate` takes calendar units: it has no clock.
- `Instant` takes time units: it has no calendar.
- `PlainDateTime` and `ZonedDateTime` take both.

```ts
Chronos(today).isSame(deadline, "M"); // fine
Chronos(today).isSame(deadline, "hour"); // type error: a PlainDate has no hours
```

## Exported types

All are type-only exports from `chronos-temporal`.

| Type                    | What it is                                                                    |
| ----------------------- | ----------------------------------------------------------------------------- |
| `SupportedTemporalType` | `PlainDate \| PlainDateTime \| ZonedDateTime \| Instant`                      |
| `CalendarUnit`          | Calendar units, by name or alias                                              |
| `TimeUnit`              | Time units, by name or alias                                                  |
| `Unit`                  | `CalendarUnit \| TimeUnit`                                                    |
| `UnitOf<T>`             | The units a value of type `T` supports                                        |
| `BetweenOptions<T>`     | Options of [`isBetween`](/api/query#isbetween) and [range](/api/range) checks |
| `ZonedParseOptions`     | Options of [`Chronos.parse`](/api/parse#zoned-types) for zoned types          |
| `Query<T>`              | The [query](/api/query) methods                                               |
| `Manipulate<T>`         | The [manipulate](/api/manipulate) methods                                     |
| `Display<T>`            | The [display](/api/display) methods                                           |
| `Range<T>`              | What [`Chronos.range`](/api/range) returns                                    |
| `Parse`                 | The signature of [`Chronos.parse`](/api/parse)                                |

`Chronos(value)` returns `Query<T> & Manipulate<T> & Display<T>`, but by the
[contract](/guide/#the-contract) that type never leaves the expression.

## Overloads

`Chronos` and `Chronos.range` have one overload per type, so a union-typed
receiver is rejected rather than widening the argument type and hiding a
`PlainDate`-versus-`ZonedDateTime` mix. Narrow the value first.
