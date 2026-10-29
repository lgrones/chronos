import { describe, expect, it } from "vite-plus/test";
import { calendarUnits, timeUnits } from "../src/shared/units.ts";

describe("unit tables", () => {
  it("name each spelling only once, across both tables", () => {
    const spellings = [calendarUnits, timeUnits].flatMap((table) =>
      Object.entries(table).flatMap(([name, aliases]) => [name, ...aliases]),
    );
    const duplicates = spellings.filter((spelling, i) => spellings.indexOf(spelling) !== i);

    expect(duplicates).toEqual([]);
  });
});
