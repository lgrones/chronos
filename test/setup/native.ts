// Fail loudly if Node lacks Temporal, rather than skip the native run.
if (typeof Temporal === "undefined" || !isNative(Temporal.PlainDate)) {
  throw new Error("native Temporal is missing: the native run needs Node 26+");
}

function isNative(fn: Function): boolean {
  return Function.prototype.toString.call(fn).includes("[native code]");
}
