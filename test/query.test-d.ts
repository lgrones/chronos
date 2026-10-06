// Type-level tests. Not run by Vitest: `vp check` type-checks this file, and an
// unused @ts-expect-error fails it.
import { Chronos } from "../src/index.ts";

declare const date: Temporal.PlainDate;
declare const dateTime: Temporal.PlainDateTime;
declare const zoned: Temporal.ZonedDateTime;
declare const instant: Temporal.Instant;
declare const dateOrZoned: Temporal.PlainDate | Temporal.ZonedDateTime;

// Same-type comparisons compile.
Chronos(date).isBefore(date) satisfies boolean;
Chronos(zoned).isBetween(zoned, zoned, { inclusive: true }) satisfies boolean;

// @ts-expect-error cross-type comparison
Chronos(date).isBefore(zoned);
// @ts-expect-error cross-type comparison
Chronos(dateTime).isSame(date);
// @ts-expect-error cross-type comparison
Chronos(zoned).isAfter(instant);
// @ts-expect-error cross-type bounds
Chronos(instant).isBetween(zoned, zoned);

// @ts-expect-error string argument (rule 3)
Chronos(date).isBefore("2026-10-06");
// @ts-expect-error string receiver (rule 3)
Chronos("2026-10-06");
// @ts-expect-error epoch number receiver (rule 3)
Chronos(Date.now());

// @ts-expect-error Chronos passed as an argument (rule 1)
Chronos(date).isBefore(Chronos(date));

// @ts-expect-error union receiver: would widen the argument and hide a mix
Chronos(dateOrZoned);
