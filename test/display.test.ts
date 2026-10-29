import { describe, expect, it } from "vite-plus/test";
import { Chronos } from "../src/index.ts";
import { ascending, chronos } from "./cases.ts";

const date = (s: string) => Temporal.PlainDate.from(s);
const dateTime = (s: string) => Temporal.PlainDateTime.from(s);
const zoned = (s: string) => Temporal.ZonedDateTime.from(s);
const instant = (s: string) => Temporal.Instant.from(s);

describe("format by pattern", () => {
  it("fills dayjs tokens, with literal text in brackets", () => {
    const value = dateTime("2026-10-06T09:05:03.250");
    expect(Chronos(value).format("DD.MM.YYYY HH:mm:ss.SSS")).toBe("06.10.2026 09:05:03.250");
    expect(Chronos(value).format("D.M.YY H:m:s.S")).toBe("6.10.26 9:5:3.2");
    expect(Chronos(value).format("YYYY [Tag] D, SS")).toBe("2026 Tag 6, 25");
  });

  it("writes a 12-hour clock with A or a", () => {
    expect(Chronos(dateTime("2026-10-06T00:30")).format("hh:mm A")).toBe("12:30 AM");
    expect(Chronos(dateTime("2026-10-06T12:30")).format("h:mm a")).toBe("12:30 pm");
    expect(Chronos(dateTime("2026-10-06T14:30")).format("h:mm A")).toBe("2:30 PM");
  });

  it("writes a ZonedDateTime as wall clock in its own zone", () => {
    expect(Chronos(zoned("2026-10-06T09:00+02:00[Europe/Vienna]")).format("HH:mm")).toBe("09:00");
  });

  it("round-trips through parse by the same pattern", () => {
    const pattern = "D.M.YY h:mm:ss.SSS a";
    const value = dateTime("2026-10-06T14:30:15.250");
    expect(Chronos.parse(Chronos(value).format(pattern), Temporal.PlainDateTime, pattern)).toEqual(
      value,
    );
  });

  it("rejects a time on a PlainDate and any pattern on an Instant", () => {
    expect(Chronos(date("2026-10-06")).format("DD.MM.YYYY")).toBe("06.10.2026");
    expect(() => Chronos(date("2026-10-06")).format("DD.MM.YYYY HH:mm")).toThrow(RangeError);
    expect(() => chronos(instant("2026-10-06T07:00Z")).format("HH:mm")).toThrow(TypeError);
  });
});

describe("format by Intl options", () => {
  it("writes de-AT unless given a locale", () => {
    const value = date("2026-10-06");
    expect(Chronos(value).format({ dateStyle: "long" })).toBe("6. Oktober 2026");
    expect(Chronos(value).format({ dateStyle: "long" }, "en-GB")).toBe("6 October 2026");
    expect(Chronos(value).format()).toBe(value.toLocaleString("de-AT"));
  });

  it("shows an Instant in UTC unless given a timeZone", () => {
    const value = instant("2026-10-06T07:00Z");
    expect(Chronos(value).format({ timeStyle: "short" })).toBe("07:00");
    expect(Chronos(value).format({ timeStyle: "short", timeZone: "Europe/Vienna" })).toBe("09:00");
  });
});

describe("from", () => {
  const base = zoned("2026-10-06T12:00+02:00[Europe/Vienna]");
  const from = (duration: Temporal.DurationLike, locale?: string) =>
    Chronos(base.add(duration)).from(base, locale);

  it("follows dayjs's thresholds", () => {
    expect(from({ seconds: 44 })).toBe("jetzt");
    expect(from({ seconds: -44 })).toBe("jetzt");
    expect(from({ seconds: 45 })).toBe("in 1 Minute");
    expect(from({ seconds: 90 })).toBe("in 2 Minuten");
    expect(from({ minutes: 44 })).toBe("in 44 Minuten");
    expect(from({ minutes: 45 })).toBe("in 1 Stunde");
    expect(from({ hours: 21 })).toBe("in 21 Stunden");
    expect(from({ hours: 22 })).toBe("in 1 Tag");
    expect(from({ hours: -36 })).toBe("vor 2 Tagen");
    expect(from({ days: 25 })).toBe("in 25 Tagen");
    expect(from({ days: 26 })).toBe("in 1 Monat");
    expect(from({ months: -10 })).toBe("vor 10 Monaten");
    expect(from({ months: 11 })).toBe("in 1 Jahr");
    expect(from({ months: 18 })).toBe("in 2 Jahren");
  });

  it("writes in the locale given", () => {
    expect(from({ hours: -3 }, "en")).toBe("3 hours ago");
    expect(from({ seconds: 3 }, "en")).toBe("now");
  });

  it("counts a PlainDate in whole days, today as heute", () => {
    const day = date("2026-10-06");
    expect(Chronos(day).from(day)).toBe("heute");
    expect(Chronos(day).from(date("2026-10-07"))).toBe("vor 1 Tag");
    expect(Chronos(day).from(date("2026-08-06"))).toBe("in 2 Monaten");
  });

  it("counts days across a clock change as calendar days", () => {
    const before = zoned("2026-10-24T12:00+02:00[Europe/Vienna]");
    expect(Chronos(before.add({ days: 2 })).from(before)).toBe("in 2 Tagen");
  });

  it.each(Object.entries(ascending))("works on %s", (_, make) => {
    const [a, b] = make();
    expect(chronos(a).from(b)).toMatch(/^vor /);
    expect(chronos(b).from(a)).toMatch(/^in /);
  });

  it("rejects another type at runtime", () => {
    expect(() => chronos(date("2026-10-06")).from(dateTime("2026-10-06T00:00"))).toThrow(TypeError);
  });
});

describe("fromNow", () => {
  it("reads now for the receiver's type", () => {
    expect(Chronos(Temporal.Now.instant().subtract({ hours: 3 })).fromNow()).toBe("vor 3 Stunden");
    expect(Chronos(Temporal.Now.plainDateISO("UTC").add({ days: 2 })).fromNow()).toBe("in 2 Tagen");
    expect(Chronos(Temporal.Now.plainDateTimeISO("UTC").add({ minutes: 10 })).fromNow("en")).toBe(
      "in 10 minutes",
    );
    expect(
      Chronos(Temporal.Now.zonedDateTimeISO("Asia/Kolkata").subtract({ days: 5 })).fromNow(),
    ).toBe("vor 5 Tagen");
  });
});
