import { describe, expect, it } from "vite-plus/test";
import { Chronos } from "../src/index.ts";
import { ascending, chronos } from "./cases.ts";

describe.each(Object.entries(ascending))("%s", (_, make) => {
  it("isBefore / isAfter / isSame", () => {
    const [early, mid, late] = make();
    expect(chronos(mid).isBefore(late)).toBe(true);
    expect(chronos(mid).isBefore(mid)).toBe(false);
    expect(chronos(mid).isAfter(early)).toBe(true);
    expect(chronos(mid).isAfter(mid)).toBe(false);
    expect(chronos(mid).isSame(mid)).toBe(true);
    expect(chronos(mid).isSame(late)).toBe(false);
  });

  it("isSameOrBefore / isSameOrAfter include equality", () => {
    const [early, mid, late] = make();
    expect(chronos(mid).isSameOrBefore(late)).toBe(true);
    expect(chronos(mid).isSameOrBefore(mid)).toBe(true);
    expect(chronos(mid).isSameOrBefore(early)).toBe(false);
    expect(chronos(mid).isSameOrAfter(early)).toBe(true);
    expect(chronos(mid).isSameOrAfter(mid)).toBe(true);
    expect(chronos(mid).isSameOrAfter(late)).toBe(false);
  });

  it("isBetween excludes the bounds by default, in either bound order", () => {
    const [early, mid, late] = make();
    expect(chronos(mid).isBetween(early, late)).toBe(true);
    expect(chronos(mid).isBetween(late, early)).toBe(true);
    expect(chronos(early).isBetween(early, late)).toBe(false);
    expect(chronos(late).isBetween(late, early)).toBe(false);
    expect(chronos(late).isBetween(early, mid)).toBe(false);
  });

  it("isBetween includes the bounds with inclusive, in either bound order", () => {
    const [early, mid, late] = make();
    const inclusive = { inclusive: true };
    expect(chronos(early).isBetween(early, late, inclusive)).toBe(true);
    expect(chronos(late).isBetween(early, late, inclusive)).toBe(true);
    expect(chronos(early).isBetween(late, early, inclusive)).toBe(true);
    expect(chronos(mid).isBetween(mid, mid, inclusive)).toBe(true);
    expect(chronos(late).isBetween(early, mid, inclusive)).toBe(false);
  });
});

describe("ZonedDateTime isSame", () => {
  it("compares the instant and ignores the zone, as dayjs does", () => {
    const vienna = Temporal.ZonedDateTime.from("2026-10-06T09:00+02:00[Europe/Vienna]");
    expect(Chronos(vienna).isSame(vienna.withTimeZone("America/New_York"))).toBe(true);
    expect(Chronos(vienna).isSame(vienna.withTimeZone("UTC"))).toBe(true);
  });
});

describe("runtime guards for untyped callers", () => {
  const date = () => Temporal.PlainDate.from("2026-10-06");

  it("rejects a receiver that is not a Temporal date type", () => {
    expect(() => chronos("2026-10-06")).toThrow(TypeError);
    expect(() => chronos(new Date())).toThrow(TypeError);
    expect(() => chronos(Temporal.PlainTime.from("09:00"))).toThrow(TypeError);
  });

  it("rejects a string argument that Temporal.compare would coerce", () => {
    // @ts-expect-error string argument
    expect(() => chronos(date()).isBefore("2026-10-07")).toThrow(TypeError);
  });

  it("rejects an argument of another Temporal type", () => {
    const zoned = Temporal.ZonedDateTime.from("2026-10-07T00:00+02:00[Europe/Vienna]");
    expect(() => chronos(date()).isBefore(zoned)).toThrow(
      /expected PlainDate, got Temporal.ZonedDateTime/,
    );
  });

  it("rejects a Chronos passed as an argument", () => {
    // @ts-expect-error Chronos as an argument
    expect(() => chronos(date()).isSame(chronos(date()))).toThrow(TypeError);
  });
});

describe("comparisons with a unit", () => {
  const dateTime = (s: string) => Temporal.PlainDateTime.from(s);
  const lastMs = dateTime("2026-10-06T23:59:59.999");
  const nextDay = dateTime("2026-10-07T00:00");

  it("treat the receiver as its whole unit", () => {
    const mid = dateTime("2026-10-06T12:00");
    expect(Chronos(mid).isSame(lastMs, "day")).toBe(true);
    expect(Chronos(mid).isSame(nextDay, "day")).toBe(false);
    expect(Chronos(mid).isBefore(lastMs, "day")).toBe(false);
    expect(Chronos(mid).isBefore(lastMs)).toBe(true);
    expect(Chronos(mid).isSameOrBefore(lastMs, "day")).toBe(true);
    expect(Chronos(lastMs).isAfter(mid, "day")).toBe(false);
    expect(Chronos(lastMs).isSameOrAfter(mid, "day")).toBe(true);
  });

  it("split at the boundary between 23:59:59.999 and 00:00 the next day", () => {
    expect(Chronos(lastMs).isBefore(nextDay, "day")).toBe(true);
    expect(Chronos(nextDay).isAfter(lastMs, "day")).toBe(true);
    expect(Chronos(lastMs).isSame(nextDay, "millisecond")).toBe(false);
    expect(Chronos(lastMs).isSame(nextDay, "month")).toBe(true);
    expect(Chronos(lastMs).isSame(nextDay, "week")).toBe(true);
  });

  it("isSame by month on a PlainDate", () => {
    const date = Temporal.PlainDate.from("2026-10-01");
    expect(Chronos(date).isSame(Temporal.PlainDate.from("2026-10-31"), "month")).toBe(true);
    expect(Chronos(date).isSame(Temporal.PlainDate.from("2026-11-01"), "month")).toBe(false);
  });

  it("isBetween with a unit, inclusive and exclusive", () => {
    const date = (s: string) => Temporal.PlainDate.from(s);
    const [from, to] = [date("2026-10-01"), date("2026-10-31")];
    expect(Chronos(date("2026-10-15")).isBetween(from, to, { unit: "month" })).toBe(false);
    expect(
      Chronos(date("2026-10-15")).isBetween(from, to, { unit: "month", inclusive: true }),
    ).toBe(true);
    expect(Chronos(date("2026-10-15")).isBetween(to, from, { unit: "day" })).toBe(true);
  });

  it("on a ZonedDateTime, uses the receiver's zone for the unit", () => {
    const vienna = Temporal.ZonedDateTime.from("2026-10-06T23:30+02:00[Europe/Vienna]");
    // 21:30 in London is the same instant, still 6 October in Vienna.
    expect(Chronos(vienna).isSame(vienna.withTimeZone("Europe/London"), "day")).toBe(true);
    // 00:30 on 7 October in Vienna.
    const later = vienna.add({ hours: 1 });
    expect(Chronos(vienna).isBefore(later.withTimeZone("Europe/London"), "day")).toBe(true);
  });

  it("type-check the argument before using the unit", () => {
    const date = Temporal.PlainDate.from("2026-10-06");
    // @ts-expect-error string argument
    expect(() => chronos(date).isSame("2026-10-06", "day")).toThrow(TypeError);
  });
});
