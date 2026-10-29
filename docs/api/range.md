# Range

`Chronos.range(a, b)` wraps a start–end pair for one expression, so it can be
checked against another range of the same type:

```ts
Chronos.range(checkIn, checkOut).overlaps(opens, closes);
```

```ts
Chronos.range(a: T, b: T): Range<T>
```

`a` and `b` may come in either order, and so may the bounds of the range it is
checked against. A range whose ends are equal is that one moment, and behaves as
`Chronos(value)` does.

Throws a `TypeError` if `a` is not a supported Temporal type, or `b` is not of
`a`'s type.

## overlaps

```ts
overlaps(from: T, to: T, options?: BetweenOptions<T>): boolean
```

Whether the receiver shares a moment with `from`–`to`. By default, ranges that
only touch, such as 09–10 and 10–11, do not overlap:

```ts
const at = (time: string) => Temporal.PlainDateTime.from(`2026-10-06T${time}`);

Chronos.range(at("09:00"), at("10:00")).overlaps(at("10:00"), at("11:00")); // false
Chronos.range(at("09:00"), at("10:00")).overlaps(at("10:00"), at("11:00"), {
  inclusive: true,
}); // true
```

## isBetween

```ts
isBetween(from: T, to: T, options?: BetweenOptions<T>): boolean
```

Whether the whole receiver range lies between `from` and `to`.

```ts
Chronos.range(at("09:00"), at("10:00")).isBetween(at("08:00"), at("11:00")); // true
```

## Options

Both methods take the options of [`isBetween`](/api/query#isbetween): bounds
are excluded unless `inclusive`, `includeStart` or `includeEnd` say otherwise,
and `unit` compares by unit.
