# Chronos

Method-style helpers over the Temporal API — extension methods without the
syntactic sugar.

```ts
Chronos(today).isBefore(deadline);
Chronos(today).add(3, "days");
```

Temporal stays the date type; `Chronos(x)` only lives for the expression it is
written in. See [docs/plan.md](docs/plan.md).

## Development

```bash
vp install
vp test
vp check
vp pack
```
