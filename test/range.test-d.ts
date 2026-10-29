// Type-level tests, checked by `vp check`. See query.test-d.ts.
import { Chronos } from "../src/index.ts";

declare const date: Temporal.PlainDate;
declare const zoned: Temporal.ZonedDateTime;
declare const instant: Temporal.Instant;
declare const dateOrZoned: Temporal.PlainDate | Temporal.ZonedDateTime;

// Same-type ranges compile.
Chronos.range(date, date).overlaps(date, date) satisfies boolean;
Chronos.range(zoned, zoned).isBetween(zoned, zoned, {
  includeStart: true,
  unit: "day",
}) satisfies boolean;

// @ts-expect-error mixed ends
Chronos.range(date, zoned);
// @ts-expect-error union ends: would widen the bounds and hide a mix
Chronos.range(dateOrZoned, dateOrZoned);
// @ts-expect-error cross-type bounds
Chronos.range(date, date).overlaps(zoned, zoned);
// @ts-expect-error string end (rule 3)
Chronos.range("2026-10-06", date);
// @ts-expect-error Chronos passed as an end (rule 1)
Chronos.range(Chronos(date), date);

// @ts-expect-error calendar unit on Instant
Chronos.range(instant, instant).overlaps(instant, instant, { unit: "day" });
// @ts-expect-error time unit on PlainDate
Chronos.range(date, date).isBetween(date, date, { unit: "hour" });
