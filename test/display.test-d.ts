// Type-level tests, checked by `vp check`. See query.test-d.ts.
import { Chronos } from "../src/index.ts";

declare const date: Temporal.PlainDate;
declare const dateTime: Temporal.PlainDateTime;
declare const zoned: Temporal.ZonedDateTime;
declare const instant: Temporal.Instant;

Chronos(date).format("DD.MM.YYYY") satisfies string;
Chronos(zoned).format({ dateStyle: "long" }, "en-GB") satisfies string;
Chronos(instant).format({ timeStyle: "short", timeZone: "Europe/Vienna" }) satisfies string;
Chronos(dateTime).from(dateTime) satisfies string;
Chronos(instant).fromNow("en") satisfies string;

// @ts-expect-error an Instant has no wall clock to fill a pattern
Chronos(instant).format("HH:mm");
// @ts-expect-error cross-type argument
Chronos(date).from(zoned);
// @ts-expect-error a Chronos as argument (rule 1)
Chronos(date).from(Chronos(date));
// @ts-expect-error string argument (rule 3)
Chronos(date).from("2026-10-06");
