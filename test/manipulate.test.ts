import { describe, expect, it } from "vite-plus/test";
import { ascending, chronos } from "./cases.ts";

describe.each(Object.entries(ascending))("%s", (_, make) => {
  it("clamp returns the receiver or the nearer bound, as raw Temporal", () => {
    const [early, mid, late] = make();
    expect(chronos(mid).clamp(early, late)).toBe(mid);
    expect(chronos(early).clamp(mid, late)).toBe(mid);
    expect(chronos(late).clamp(early, mid)).toBe(mid);
  });

  it("clamp throws when min is after max", () => {
    const [early, mid, late] = make();
    expect(() => chronos(mid).clamp(late, early)).toThrow(RangeError);
  });
});
