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
