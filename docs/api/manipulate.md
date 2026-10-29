# Manipulate

Operations that yield a new value of the receiver's type. They return raw
Temporal, so the native chain carries on:

```ts
const today = Temporal.PlainDate.from("2026-10-06");

Chronos(today).startOf("month").add({ days: 14 }); // 2026-10-15
```

## startOf

```ts
startOf(unit: UnitOf<T>): T
```

The first value of the `unit` that contains the receiver. Weeks start on Monday.

```ts
const today = Temporal.PlainDate.from("2026-10-06"); // a Tuesday

Chronos(today).startOf("month"); // 2026-10-01
Chronos(today).startOf("week"); // 2026-10-05

const now = Temporal.PlainDateTime.from("2026-10-06T14:35:12");
Chronos(now).startOf("hour"); // 2026-10-06T14:00:00
```

On a `ZonedDateTime`, a day starts when its zone says, which is not always
midnight. On an `Instant`, units are floored in UTC.

## endOf

```ts
endOf(unit: UnitOf<T>): T
```

The last value of the `unit` that contains the receiver: the last day on a
`PlainDate`, otherwise one nanosecond before the next unit starts.

```ts
Chronos(today).endOf("month"); // 2026-10-31
Chronos(now).endOf("day"); // 2026-10-06T23:59:59.999999999
```

## clamp

```ts
clamp(a: T, b: T): T
```

The receiver limited to the range between `a` and `b`, in either order.

```ts
const first = Temporal.PlainDate.from("2026-10-10");
const last = Temporal.PlainDate.from("2026-10-31");

Chronos(today).clamp(first, last); // 2026-10-10
Chronos(today).clamp(last, first); // 2026-10-10: either order
```

## Errors

`clamp` throws a `TypeError` if a bound is not of the receiver's type.
`startOf` and `endOf` throw a `RangeError` if `unit` is not a unit, or one the
receiver's type lacks, such as `"hour"` on a `PlainDate`.
