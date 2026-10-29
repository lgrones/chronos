import { describe, expect, it } from "vite-plus/test";
import { ascending, chronos } from "./cases.ts";

describe.each(Object.entries(ascending))("%s", (_, make) => {
  it("clamp returns the receiver or the nearer bound, as raw Temporal", () => {
    const [early, mid, late] = make();
    expect(chronos(mid).clamp(early, late)).toBe(mid);
    expect(chronos(early).clamp(mid, late)).toBe(mid);
    expect(chronos(late).clamp(early, mid)).toBe(mid);
  });

  it("clamp accepts the bounds in either order", () => {
    const [early, mid, late] = make();
    expect(chronos(mid).clamp(late, early)).toBe(mid);
    expect(chronos(early).clamp(late, mid)).toBe(mid);
    expect(chronos(late).clamp(mid, early)).toBe(mid);
  });
});

describe("startOf / endOf", () => {
  const date = (s: string) => Temporal.PlainDate.from(s);
  const dateTime = (s: string) => Temporal.PlainDateTime.from(s);
  const zoned = (s: string) => Temporal.ZonedDateTime.from(s);
  const instant = (s: string) => Temporal.Instant.from(s);
  const expectEqual = (actual: { toString(): string }, expected: { toString(): string }) =>
    expect(actual.toString()).toBe(expected.toString());

  it.each([
    ["year", "2026-01-01", "2026-12-31"],
    ["month", "2026-10-01", "2026-10-31"],
    ["week", "2026-10-05", "2026-10-11"],
    ["day", "2026-10-07", "2026-10-07"],
  ] as const)("PlainDate %s", (unit, start, end) => {
    expectEqual(chronos(date("2026-10-07")).startOf(unit), date(start));
    expectEqual(chronos(date("2026-10-07")).endOf(unit), date(end));
  });

  it("starts weeks on Monday, across a year boundary", () => {
    expectEqual(chronos(date("2027-01-01")).startOf("week"), date("2026-12-28"));
    expectEqual(chronos(date("2026-12-28")).endOf("week"), date("2027-01-03"));
    expectEqual(chronos(date("2026-10-05")).startOf("week"), date("2026-10-05"));
    expectEqual(chronos(date("2026-10-11")).startOf("week"), date("2026-10-05"));
  });

  it("ends February on its last day, in a leap year too", () => {
    expectEqual(chronos(date("2028-02-10")).endOf("month"), date("2028-02-29"));
    expectEqual(chronos(date("2026-02-10")).endOf("month"), date("2026-02-28"));
  });

  it.each([
    ["year", "2026-01-01T00:00", "2026-12-31T23:59:59.999999999"],
    ["month", "2026-10-01T00:00", "2026-10-31T23:59:59.999999999"],
    ["week", "2026-10-05T00:00", "2026-10-11T23:59:59.999999999"],
    ["day", "2026-10-07T00:00", "2026-10-07T23:59:59.999999999"],
    ["hour", "2026-10-07T14:00", "2026-10-07T14:59:59.999999999"],
    ["minute", "2026-10-07T14:35", "2026-10-07T14:35:59.999999999"],
    ["second", "2026-10-07T14:35:12", "2026-10-07T14:35:12.999999999"],
    ["millisecond", "2026-10-07T14:35:12.345", "2026-10-07T14:35:12.345999999"],
  ] as const)("PlainDateTime %s", (unit, start, end) => {
    const value = dateTime("2026-10-07T14:35:12.345678");
    expectEqual(chronos(value).startOf(unit), dateTime(start));
    expectEqual(chronos(value).endOf(unit), dateTime(end));
  });

  it("keeps the zone on a ZonedDateTime", () => {
    const value = zoned("2026-10-07T14:35+02:00[Europe/Vienna]");
    expectEqual(chronos(value).startOf("month"), zoned("2026-10-01T00:00+02:00[Europe/Vienna]"));
    // October ends after the switch back to winter time.
    expectEqual(
      chronos(value).endOf("month"),
      zoned("2026-10-31T23:59:59.999999999+01:00[Europe/Vienna]"),
    );
    expectEqual(chronos(value).startOf("hour"), zoned("2026-10-07T14:00+02:00[Europe/Vienna]"));
  });

  it("starts a ZonedDateTime day when the zone does, not at midnight", () => {
    // Chile moves its clocks from 00:00 to 01:00 on 6 September 2026.
    const changeover = zoned("2026-09-06T12:00-03:00[America/Santiago]");
    expectEqual(
      chronos(changeover).startOf("day"),
      zoned("2026-09-06T01:00-03:00[America/Santiago]"),
    );
    expectEqual(
      chronos(changeover).endOf("day"),
      zoned("2026-09-06T23:59:59.999999999-03:00[America/Santiago]"),
    );
    const before = zoned("2026-09-05T12:00-04:00[America/Santiago]");
    expectEqual(
      chronos(before).endOf("day"),
      zoned("2026-09-05T23:59:59.999999999-04:00[America/Santiago]"),
    );
  });

  it("floors an Instant in UTC", () => {
    const value = instant("2026-10-07T14:35:12.345Z");
    expectEqual(chronos(value).startOf("hour"), instant("2026-10-07T14:00Z"));
    expectEqual(chronos(value).endOf("minute"), instant("2026-10-07T14:35:59.999999999Z"));
  });

  it("throws on a unit the type does not have", () => {
    // The helper accepts any unit; the runtime still rejects this one.
    expect(() => chronos(date("2026-10-07")).startOf("hour")).toThrow(RangeError);
    expect(() => chronos(instant("2026-10-07T14:35Z")).endOf("day")).toThrow(
      /Instant has no unit day/,
    );
    // @ts-expect-error unknown unit
    expect(() => chronos(dateTime("2026-10-07T14:35")).startOf("fortnight")).toThrow(
      /unknown unit fortnight/,
    );
  });

  it("accepts every alias of a unit, case-sensitively", () => {
    const value = dateTime("2026-10-07T14:35:12.345");
    for (const [alias, unit] of [
      ["years", "year"],
      ["y", "year"],
      ["M", "month"],
      ["w", "week"],
      ["d", "day"],
      ["h", "hour"],
      ["m", "minute"],
      ["mins", "minute"],
      ["s", "second"],
      ["sec", "second"],
      ["secs", "second"],
      ["ms", "millisecond"],
    ] as const) {
      expectEqual(chronos(value).startOf(alias), chronos(value).startOf(unit));
      expectEqual(chronos(value).endOf(alias), chronos(value).endOf(unit));
    }
  });
});
