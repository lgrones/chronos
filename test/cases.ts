import { Chronos } from "../src/index.ts";
import type { Manipulate } from "../src/manipulate.ts";
import type { Query } from "../src/query.ts";

/** Three ascending values per supported type. Built lazily so the polyfill is in place. */
export const ascending = {
  PlainDate: () =>
    ["2026-10-05", "2026-10-06", "2026-10-07"].map((s) => Temporal.PlainDate.from(s)),
  PlainDateTime: () =>
    ["2026-10-06T09:00", "2026-10-06T09:30", "2026-10-06T10:00"].map((s) =>
      Temporal.PlainDateTime.from(s),
    ),
  ZonedDateTime: () =>
    [
      "2026-10-06T09:00+02:00[Europe/Vienna]",
      "2026-10-06T09:30+02:00[Europe/Vienna]",
      "2026-10-06T10:00+02:00[Europe/Vienna]",
    ].map((s) => Temporal.ZonedDateTime.from(s)),
  Instant: () =>
    ["2026-10-06T07:00Z", "2026-10-06T07:30Z", "2026-10-06T08:00Z"].map((s) =>
      Temporal.Instant.from(s),
    ),
};

/** `Chronos` without its overloads, which reject the union receivers table-driven tests pass. */
export const chronos = Chronos as (value: unknown) => Query<unknown> & Manipulate<unknown>;
