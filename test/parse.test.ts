import { describe, expect, it } from "vite-plus/test";
import { Chronos } from "../src/index.ts";

const date = (s: string) => Temporal.PlainDate.from(s);
const dateTime = (s: string) => Temporal.PlainDateTime.from(s);

describe("parse into PlainDate", () => {
  it("reads ISO dates by default, more strictly than PlainDate.from", () => {
    expect(Chronos.parse("2026-10-06", Temporal.PlainDate)).toEqual(date("2026-10-06"));
    for (const input of ["2026-10-06T14:30", "20261006", "2026-10-06[u-ca=iso8601]"])
      expect(() => Chronos.parse(input, Temporal.PlainDate), input).toThrow(RangeError);
  });

  it("takes one or two digits for D and M", () => {
    expect(Chronos.parse("06.10.2026", Temporal.PlainDate, "D.M.YYYY")).toEqual(date("2026-10-06"));
    expect(Chronos.parse("6.10.2026", Temporal.PlainDate, "D.M.YYYY")).toEqual(date("2026-10-06"));
  });

  it("follows a dayjs-style format, with literal text in brackets", () => {
    expect(Chronos.parse("10/06/26", Temporal.PlainDate, "MM/DD/YY")).toEqual(date("2026-10-06"));
    expect(Chronos.parse("2026 Tag 6 M10", Temporal.PlainDate, "YYYY [Tag] D [M]M")).toEqual(
      date("2026-10-06"),
    );
  });

  it("puts two-digit years 00–68 in the 2000s and 69–99 in the 1900s, as dayjs", () => {
    expect(Chronos.parse("1.1.68", Temporal.PlainDate, "D.M.YY").year).toBe(2068);
    expect(Chronos.parse("1.1.69", Temporal.PlainDate, "D.M.YY").year).toBe(1969);
  });

  it("rejects dates that do not exist", () => {
    expect(() => Chronos.parse("2026-02-31", Temporal.PlainDate)).toThrow(RangeError);
    expect(() => Chronos.parse("2026-02-29", Temporal.PlainDate)).toThrow(RangeError);
    expect(() => Chronos.parse("2026-13-01", Temporal.PlainDate)).toThrow(RangeError);
    expect(Chronos.parse("2028-02-29", Temporal.PlainDate)).toEqual(date("2028-02-29"));
  });

  it("rejects input that does not fit the format, strictly", () => {
    for (const input of ["06.10.2026", "26-10-06", " 2026-10-06", "2026-10-06 ", "2026/10/06"])
      expect(() => Chronos.parse(input, Temporal.PlainDate), input).toThrow(RangeError);
    expect(() => Chronos.parse("6.10.2026", Temporal.PlainDate, "DD.MM.YYYY")).toThrow(RangeError);
  });

  it("rejects formats without a year, month or day, or with a time", () => {
    expect(() => Chronos.parse("06.10", Temporal.PlainDate, "DD.MM")).toThrow(TypeError);
    expect(() => Chronos.parse("06.10. 14:30", Temporal.PlainDateTime, "DD.MM. HH:mm")).toThrow(
      TypeError,
    );
    expect(() => Chronos.parse("06.10.2026 14", Temporal.PlainDate, "DD.MM.YYYY HH")).toThrow(
      RangeError,
    );
  });
});

describe("parse into PlainDateTime", () => {
  it("reads ISO date and time to the minute by default", () => {
    expect(Chronos.parse("2026-10-06T09:05", Temporal.PlainDateTime)).toEqual(
      dateTime("2026-10-06T09:05"),
    );
    for (const input of [
      "2026-10-06",
      "2026-10-06 09:05",
      "2026-10-06T09:05:00",
      "2026-10-06T9:05",
    ])
      expect(() => Chronos.parse(input, Temporal.PlainDateTime), input).toThrow(RangeError);
  });

  it("reads seconds and fractions, and leaves out time fields as 0", () => {
    expect(
      Chronos.parse("06.10.2026 14:30:15.250", Temporal.PlainDateTime, "DD.MM.YYYY HH:mm:ss.SSS"),
    ).toEqual(dateTime("2026-10-06T14:30:15.250"));
    expect(
      Chronos.parse("06.10.2026 14:30:15.2", Temporal.PlainDateTime, "DD.MM.YYYY HH:mm:ss.S"),
    ).toEqual(dateTime("2026-10-06T14:30:15.200"));
    expect(Chronos.parse("06.10.2026", Temporal.PlainDateTime, "DD.MM.YYYY")).toEqual(
      dateTime("2026-10-06T00:00"),
    );
  });

  it("reads 12-hour times with a meridiem", () => {
    const format = "M/D/YYYY h:mm A";
    expect(Chronos.parse("10/6/2026 12:15 AM", Temporal.PlainDateTime, format).hour).toBe(0);
    expect(Chronos.parse("10/6/2026 12:15 PM", Temporal.PlainDateTime, format).hour).toBe(12);
    expect(Chronos.parse("10/6/2026 2:15 PM", Temporal.PlainDateTime, format).hour).toBe(14);
    expect(Chronos.parse("10/6/2026 2:15 pm", Temporal.PlainDateTime, "M/D/YYYY h:mm a").hour).toBe(
      14,
    );
    expect(() => Chronos.parse("10/6/2026 13:15 PM", Temporal.PlainDateTime, format)).toThrow(
      RangeError,
    );
  });

  it("reads 12-hour times without a meridiem as before noon, as dayjs", () => {
    expect(Chronos.parse("6.10.2026 2", Temporal.PlainDateTime, "D.M.YYYY h").hour).toBe(2);
    expect(Chronos.parse("6.10.2026 12", Temporal.PlainDateTime, "D.M.YYYY h").hour).toBe(0);
    expect(() => Chronos.parse("6.10.2026 14 PM", Temporal.PlainDateTime, "D.M.YYYY H A")).toThrow(
      RangeError,
    );
  });

  it("rejects times that do not exist", () => {
    expect(() => Chronos.parse("2026-10-06T24:00", Temporal.PlainDateTime)).toThrow(RangeError);
    expect(() => Chronos.parse("2026-10-06T09:60", Temporal.PlainDateTime)).toThrow(RangeError);
  });
});

describe("parse into ZonedDateTime and Instant", () => {
  const timeZone = "Europe/Vienna";

  it("reads the wall-clock time in the given zone", () => {
    expect(Chronos.parse("2026-10-06T14:30", Temporal.ZonedDateTime, { timeZone })).toEqual(
      Temporal.ZonedDateTime.from("2026-10-06T14:30+02:00[Europe/Vienna]"),
    );
    expect(
      Chronos.parse("06.10.2026", Temporal.Instant, { format: "DD.MM.YYYY", timeZone }),
    ).toEqual(Temporal.Instant.from("2026-10-05T22:00Z"));
  });

  it("rejects a time in the gap when the clocks go forward", () => {
    expect(() => Chronos.parse("2026-03-29T02:30", Temporal.ZonedDateTime, { timeZone })).toThrow(
      RangeError,
    );
  });

  it("takes the earlier of a time that exists twice when the clocks go back", () => {
    expect(Chronos.parse("2026-10-25T02:30", Temporal.ZonedDateTime, { timeZone }).offset).toBe(
      "+02:00",
    );
  });

  it("needs a time zone", () => {
    // @ts-expect-error no options
    expect(() => Chronos.parse("2026-10-06T14:30", Temporal.ZonedDateTime)).toThrow(TypeError);
    // @ts-expect-error no timeZone
    expect(() => Chronos.parse("2026-10-06T14:30", Temporal.Instant, {})).toThrow(TypeError);
  });
});

describe("runtime guards for untyped callers", () => {
  it("rejects a type that is not a supported Temporal type", () => {
    // @ts-expect-error unsupported type
    expect(() => Chronos.parse("14:30", Temporal.PlainTime, "HH:mm")).toThrow(TypeError);
    // @ts-expect-error not a type
    expect(() => Chronos.parse("6.10.2026", "PlainDate")).toThrow(TypeError);
  });
});
