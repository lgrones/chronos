import { describe, expect, it } from "vite-plus/test";
import { Chronos } from "../src/index.ts";
import { ascending, chronos, chronosRange } from "./cases.ts";

describe.each(Object.entries(ascending))("%s", (_, make) => {
  it("isBetween excludes the bounds by default, in either order on both ranges", () => {
    const [a, b, c, d] = make();
    expect(chronosRange(b, c).isBetween(a, d)).toBe(true);
    expect(chronosRange(c, b).isBetween(d, a)).toBe(true);
    expect(chronosRange(a, c).isBetween(a, d)).toBe(false);
    expect(chronosRange(b, d).isBetween(a, d)).toBe(false);
    expect(chronosRange(a, d).isBetween(b, c)).toBe(false);
  });

  it("isBetween includes the bounds with inclusive, includeStart or includeEnd", () => {
    const [a, b, c, d] = make();
    expect(chronosRange(a, d).isBetween(a, d, { inclusive: true })).toBe(true);
    expect(chronosRange(a, c).isBetween(d, a, { includeStart: true })).toBe(true);
    expect(chronosRange(b, d).isBetween(a, d, { includeStart: true })).toBe(false);
    expect(chronosRange(b, d).isBetween(a, d, { includeEnd: true })).toBe(true);
    expect(chronosRange(a, c).isBetween(a, d, { inclusive: true, includeStart: false })).toBe(
      false,
    );
  });

  it("overlaps when the ranges share a moment, in either order on both ranges", () => {
    const [a, b, c, d] = make();
    expect(chronosRange(a, c).overlaps(b, d)).toBe(true);
    expect(chronosRange(c, a).overlaps(d, b)).toBe(true);
    expect(chronosRange(a, d).overlaps(b, c)).toBe(true);
    expect(chronosRange(b, c).overlaps(a, d)).toBe(true);
    expect(chronosRange(a, b).overlaps(c, d)).toBe(false);
    expect(chronosRange(a, b).overlaps(c, d, { inclusive: true })).toBe(false);
  });

  it("does not overlap a range it only touches, unless that bound is included", () => {
    const [a, b, c] = make();
    expect(chronosRange(a, b).overlaps(b, c)).toBe(false);
    expect(chronosRange(a, b).overlaps(b, c, { inclusive: true })).toBe(true);
    expect(chronosRange(a, b).overlaps(b, c, { includeStart: true })).toBe(true);
    expect(chronosRange(a, b).overlaps(b, c, { includeEnd: true })).toBe(false);
    expect(chronosRange(b, c).overlaps(a, b, { includeEnd: true })).toBe(true);
  });

  it("treats a range with equal ends as that moment, as Chronos(value) does", () => {
    const [a, b, c] = make();
    for (const [from, to] of [
      [a, c],
      [b, c],
      [a, b],
    ]) {
      for (const options of [{}, { inclusive: true }, { includeStart: true }, { includeEnd: true }])
        expect(chronosRange(b, b).isBetween(from, to, options)).toBe(
          chronos(b).isBetween(from, to, options),
        );
    }
    expect(chronosRange(b, b).overlaps(a, c)).toBe(true);
    expect(chronosRange(b, b).overlaps(b, c)).toBe(false);
    expect(chronosRange(b, b).overlaps(b, c, { inclusive: true })).toBe(true);
  });
});

describe("ranges with a unit", () => {
  const dateTime = (s: string) => Temporal.PlainDateTime.from(s);
  const nine = dateTime("2026-10-06T09:00");
  const ten = dateTime("2026-10-06T10:00");
  const eleven = dateTime("2026-10-06T11:00");

  it("exclude a bound's whole unit, so ranges in one day do not overlap by day", () => {
    expect(Chronos.range(nine, ten).overlaps(ten, eleven, { unit: "day" })).toBe(false);
    expect(Chronos.range(nine, ten).overlaps(ten, eleven, { unit: "day", inclusive: true })).toBe(
      true,
    );
    expect(
      Chronos.range(nine, ten).overlaps(eleven, eleven, { unit: "day", inclusive: true }),
    ).toBe(true);
  });

  it("isBetween by day spans the bounds' days", () => {
    const [from, to] = [dateTime("2026-10-05T23:00"), dateTime("2026-10-07T01:00")];
    expect(Chronos.range(nine, eleven).isBetween(from, to, { unit: "day" })).toBe(true);
    expect(Chronos.range(nine, to).isBetween(from, to, { unit: "day" })).toBe(false);
    expect(Chronos.range(nine, to).isBetween(from, to, { unit: "day", includeEnd: true })).toBe(
      true,
    );
  });
});

describe("runtime guards for untyped callers", () => {
  const date = Temporal.PlainDate.from("2026-10-06");
  const zoned = Temporal.ZonedDateTime.from("2026-10-06T09:00+02:00[Europe/Vienna]");

  it("rejects ends that are not one supported Temporal type", () => {
    expect(() => chronosRange("2026-10-06", date)).toThrow(TypeError);
    expect(() => chronosRange(date, zoned)).toThrow(TypeError);
  });

  it("rejects bounds of another type", () => {
    // @ts-expect-error cross-type bounds
    expect(() => Chronos.range(date, date).overlaps(zoned, zoned)).toThrow(TypeError);
    // @ts-expect-error cross-type bounds
    expect(() => Chronos.range(date, date).isBetween(date, zoned)).toThrow(TypeError);
  });
});
