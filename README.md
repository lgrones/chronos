<div align="center">
  <img src="docs/assets/wordmark.svg" alt="Chronos" width="420">
  <p><em>Method-style helpers over the Temporal API. Extension methods, without the syntactic sugar.</em></p>
  <p>
    <img alt="MIT licence" src="https://img.shields.io/badge/licence-MIT-blue">
    <img alt="TypeScript 7" src="https://img.shields.io/badge/TypeScript-7-3178C6?logo=typescript&logoColor=white">
    <img alt="Vite+" src="https://img.shields.io/badge/Vite%2B-1.0-646CFF?logo=vite&logoColor=white">
    <img alt="Status: early" src="https://img.shields.io/badge/status-early-orange">
  </p>
  <p>
    <a href="#what-this-is">What this is</a> · <a href="#usage">Usage</a> · <a href="#the-contract">The contract</a> · <a href="#development">Development</a> · <a href="docs/plan.md">Plan</a>
  </p>
</div>

## What this is

Temporal fixes JavaScript dates: separate types for a date, a wall-clock time and
an instant, real time zones, immutability. What it lacks is the dayjs reading
order — `dayjs(a).isBefore(b)` reads left to right; `Temporal.PlainDate.compare(a, b) < 0`
does not. C# would solve that with extension methods. JavaScript has none, so
Chronos writes the `this` out:

```ts
Chronos(today).isBefore(deadline);
```

**Chronos is not a date library, and does not want to become one.** Temporal is
the date library. Chronos is a few dozen small functions that make Temporal read
better, and it holds no data of its own.

**Copy what you need.** Every helper is a few lines over a native Temporal call.
If you want three of them, lift those three into your project — no dependency, no
attribution beyond what the MIT licence asks.

> [!NOTE]
> Early days. The API below is the target in [docs/plan.md](docs/plan.md), not
> yet what `src` exports.

## Usage

```ts
import { Chronos } from "chronos";

const today = Chronos.today(); // Temporal.PlainDate

Chronos(today).isBefore(deadline); // deadline is a plain Temporal.PlainDate
Chronos(today).isBetween(start, end, { inclusive: true });

Chronos(today).add(1, "day"); // singular or plural, whichever reads
Chronos(today).subtract(3, "weeks");

Chronos(today).startOf("month").add({ days: 14 }); // returns Temporal: native chain continues
Chronos(today).format(); // "06.10.2026", de-AT by default
```

Units follow the receiver. A `PlainDate` takes `day`, `week`, `month`, `year`; an
`Instant` takes time units only. TypeScript rejects the rest, as Temporal would at
runtime.

### Requirements

A global `Temporal`. Node 26, Chrome and Edge 144+ and Firefox 139+ ship it.
Safari does not yet. Until it does, load a polyfill once at your entry point:

```ts
import "temporal-polyfill/global";
```

Chronos never imports a polyfill itself. Two `Temporal` implementations side by
side would break `instanceof`.

## The contract

`Chronos(x)` lives for one expression. These rules keep it from becoming dayjs:

1. Only the receiver is wrapped. Arguments are raw Temporal values.
2. Anything that yields a date yields raw Temporal, never a `Chronos`.
3. No strings or epoch numbers stand in for dates. Parse first, then call.
4. `Chronos` never appears in a signature, a prop, stored state or JSON.
5. No built-in prototype is touched.

Removing Chronos from a project should mean rewriting call sites, never data
flow.

## Development

Built with [Vite+](https://viteplus.dev): tsdown packs, Vitest tests, Oxlint and
Oxfmt check.

```bash
vp install

# Tests, once or watching
vp test
vp test --watch

# Format, lint and type check; then fix what can be fixed
vp check
vp check --fix

# Build dist/
vp pack
```

## Licence

[MIT](LICENSE) © Leah Grones
