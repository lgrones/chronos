import { expect, it } from "vite-plus/test";

it("runs on the implementation its project names", () => {
  const native = Function.prototype.toString.call(Temporal.PlainDate).includes("[native code]");
  expect(native ? "native" : "polyfill").toBe(process.env.TEMPORAL_IMPL);
});
