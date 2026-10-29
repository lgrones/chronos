// Type-level tests, checked by `vp check`. See query.test-d.ts.
import { Chronos } from "../src/index.ts";

// The result has the type asked for.
Chronos.parse("06.10.2026", Temporal.PlainDate) satisfies Temporal.PlainDate;
Chronos.parse(
  "6.10.26 14:30",
  Temporal.PlainDateTime,
  "D.M.YY HH:mm",
) satisfies Temporal.PlainDateTime;
Chronos.parse("06.10.2026 14:30", Temporal.ZonedDateTime, {
  format: "DD.MM.YYYY HH:mm",
  timeZone: "Europe/Vienna",
}) satisfies Temporal.ZonedDateTime;
Chronos.parse("06.10.2026 14:30", Temporal.Instant, {
  timeZone: "Europe/Vienna",
}) satisfies Temporal.Instant;

// @ts-expect-error zoned types need a timeZone
Chronos.parse("06.10.2026 14:30", Temporal.ZonedDateTime);
// @ts-expect-error zoned types need a timeZone, not just a format
Chronos.parse("06.10.2026 14:30", Temporal.Instant, "DD.MM.YYYY HH:mm");
// @ts-expect-error unsupported type
Chronos.parse("14:30", Temporal.PlainTime);
// @ts-expect-error input must be a string
Chronos.parse(20261006, Temporal.PlainDate);
// @ts-expect-error the result is a PlainDate, not a PlainDateTime
Chronos.parse("06.10.2026", Temporal.PlainDate) satisfies Temporal.PlainDateTime;
