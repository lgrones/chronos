import { installImplementation } from "temporal-polyfill/shim";

// `temporal-polyfill/global` skips installing when native Temporal exists, so
// on Node 26 it would leave this run testing native again. Force it instead.
installImplementation();

if (Function.prototype.toString.call(Temporal.PlainDate).includes("[native code]")) {
  throw new Error("polyfill did not replace native Temporal");
}
