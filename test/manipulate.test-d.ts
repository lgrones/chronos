// Type-level tests, checked by `vp check`. See query.test-d.ts.
import { Chronos } from "../src/index.ts";

declare const date: Temporal.PlainDate;
declare const zoned: Temporal.ZonedDateTime;
declare const instant: Temporal.Instant;

// clamp yields raw Temporal, so the native chain carries on (rule 2).
Chronos(instant).clamp(instant, instant) satisfies Temporal.Instant;
Chronos(date).clamp(date, date).add({ days: 1 }) satisfies Temporal.PlainDate;

// @ts-expect-error cross-type bounds
Chronos(date).clamp(zoned, zoned);

// startOf / endOf yield raw Temporal of the receiver's type.
Chronos(zoned).startOf("week") satisfies Temporal.ZonedDateTime;
Chronos(date).endOf("month").add({ days: 1 }) satisfies Temporal.PlainDate;

// @ts-expect-error time unit on PlainDate
Chronos(date).startOf("hour");
// @ts-expect-error calendar unit on Instant
Chronos(instant).endOf("day");
// @ts-expect-error unknown unit
Chronos(zoned).startOf("fortnight");
// @ts-expect-error aliases are case-sensitive
Chronos(zoned).startOf("Y");

// Aliases follow the receiver's type, as the names do.
Chronos(date).startOf("M") satisfies Temporal.PlainDate;
Chronos(instant).endOf("secs") satisfies Temporal.Instant;
// @ts-expect-error time unit alias on PlainDate
Chronos(date).startOf("h");
// @ts-expect-error calendar unit alias on Instant
Chronos(instant).startOf("days");
