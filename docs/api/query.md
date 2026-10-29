# Query

Comparisons of the receiver against another value of its type. Each returns a
`boolean`.

```ts
const today = Temporal.PlainDate.from("2026-10-06");
const deadline = Temporal.PlainDate.from("2026-10-20");

Chronos(today).isBefore(deadline); // true
Chronos(today).isSame(deadline, "month"); // true
Chronos(today).isSame(deadline, "week"); // false
```

## Comparing by unit

Every method takes an optional `unit`. With a unit, the receiver stands for the
whole unit that contains it, as in Day.js: `isSame(other, "month")` is true for
any `other` in the receiver's month, and `isBefore(other, "day")` only once
`other` is on a later day. Weeks start on Monday.

Units follow the receiver: see [Units and types](/api/types).

## isBefore

```ts
isBefore(other: T, unit?: UnitOf<T>): boolean
```

Whether the receiver is strictly before `other`.

## isAfter

```ts
isAfter(other: T, unit?: UnitOf<T>): boolean
```

Whether the receiver is strictly after `other`.

## isSame

```ts
isSame(other: T, unit?: UnitOf<T>): boolean
```

Whether the receiver is the same point in time as `other`. On a
`ZonedDateTime`, zone and calendar are ignored, as in Day.js; with a `unit`, the
receiver's zone decides where the unit starts and ends.

## isSameOrBefore

```ts
isSameOrBefore(other: T, unit?: UnitOf<T>): boolean
```

Whether the receiver is the same as or before `other`.

## isSameOrAfter

```ts
isSameOrAfter(other: T, unit?: UnitOf<T>): boolean
```

Whether the receiver is the same as or after `other`.

## isBetween

```ts
isBetween(from: T, to: T, options?: BetweenOptions<T>): boolean
```

Whether the receiver lies between `from` and `to`. Either bound order works, as
in Day.js. Bounds are excluded unless the options say otherwise:

```ts
const start = Temporal.PlainDate.from("2026-10-06");
const end = Temporal.PlainDate.from("2026-10-20");

Chronos(start).isBetween(start, end); // false: bounds are excluded
Chronos(start).isBetween(start, end, { inclusive: true }); // true
Chronos(start).isBetween(start, end, { includeStart: true }); // true
Chronos(start).isBetween(end, start, { inclusive: true }); // true: either order
```

| Option         | Type        | Meaning                                                    |
| -------------- | ----------- | ---------------------------------------------------------- |
| `inclusive`    | `boolean`   | Whether both bounds count                                  |
| `includeStart` | `boolean`   | Whether the earlier bound counts; overrides `inclusive`    |
| `includeEnd`   | `boolean`   | Whether the later bound counts; overrides `inclusive`      |
| `unit`         | `UnitOf<T>` | Compare by unit; an excluded bound excludes its whole unit |

## Errors

All methods throw a `TypeError` if an argument is not of the receiver's type,
and a `RangeError` if `unit` is not a unit, or one the receiver's type lacks.
