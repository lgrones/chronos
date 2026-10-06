import { manipulate, type Manipulate } from "./manipulate.ts";
import { query, type Query } from "./query.ts";
import { createComparable, type SupportedTemporalType } from "./comparable.ts";

/** The methods `Chronos(value)` offers for a receiver of type `T`. */
type Methods<T> = Query<T> & Manipulate<T>;

/**
 * Wraps a Temporal value for one expression, so methods read left to right:
 * `Chronos(today).isBefore(deadline)`. Arguments stay raw Temporal, and
 * anything that yields a date yields raw Temporal.
 *
 * One overload per type, so a union-typed receiver is rejected rather than
 * widening the argument type and hiding a PlainDate-vs-ZonedDateTime mix.
 *
 * @throws {TypeError} if `value` is not a supported Temporal type.
 */
export function Chronos(value: Temporal.PlainDate): Methods<Temporal.PlainDate>;
/** Wraps a `PlainDateTime` for one expression. See the `PlainDate` overload. */
export function Chronos(value: Temporal.PlainDateTime): Methods<Temporal.PlainDateTime>;
/** Wraps a `ZonedDateTime` for one expression. See the `PlainDate` overload. */
export function Chronos(value: Temporal.ZonedDateTime): Methods<Temporal.ZonedDateTime>;
/** Wraps an `Instant` for one expression. See the `PlainDate` overload. */
export function Chronos(value: Temporal.Instant): Methods<Temporal.Instant>;
export function Chronos(value: SupportedTemporalType): Methods<SupportedTemporalType> {
  const comparable = createComparable(value);
  return { ...query(comparable), ...manipulate(comparable) };
}
