import type { SupportedTemporalType } from "./types.ts";

/**
 * Every unit by its name, with the aliases that also mean it. The unit types and
 * the runtime lookup are derived from these two tables, so adding an alias here
 * is all it takes. Aliases are case-sensitive: `M` is month, `m` minute, as in
 * dayjs. A test checks that no spelling names two units.
 */
export const calendarUnits = {
  year: ["years", "y"],
  month: ["months", "M"],
  week: ["weeks", "w"],
  day: ["days", "d"],
} as const;

export const timeUnits = {
  hour: ["hours", "h"],
  minute: ["minutes", "m", "min", "mins"],
  second: ["seconds", "s", "sec", "secs"],
  millisecond: ["milliseconds", "ms"],
} as const;

/** Each name in `Table` and its aliases. */
type Spellings<Table extends Record<string, readonly string[]>> = {
  [Name in keyof Table]: Name | Table[Name][number];
}[keyof Table];

/** Units a calendar date has, by name or alias. */
export type CalendarUnit = Spellings<typeof calendarUnits>;
/** Units a clock has, by name or alias. */
export type TimeUnit = Spellings<typeof timeUnits>;
/** Every unit `startOf`, `endOf` and the comparisons accept. */
export type Unit = CalendarUnit | TimeUnit;

/**
 * The units a value of type `T` supports: a `PlainDate` has no clock, an
 * `Instant` no calendar, the others both.
 */
export type UnitOf<T extends SupportedTemporalType> = T extends Temporal.PlainDate
  ? CalendarUnit
  : T extends Temporal.Instant
    ? TimeUnit
    : Unit;

/** A time unit by its name, which is also its Temporal name in the singular. */
export type TimeUnitName = keyof typeof timeUnits;
/** A unit by its name, which is also its Temporal name in the singular. */
export type UnitName = keyof typeof calendarUnits | TimeUnitName;

/** A unit resolved from any of its spellings. */
export interface ResolvedUnit {
  name: UnitName;
  /** Whether it is a calendar unit, as opposed to a time unit. */
  calendar: boolean;
}

const lookup = new Map<string, ResolvedUnit>();

for (const [table, calendar] of [
  [calendarUnits, true],
  [timeUnits, false],
] as const) {
  for (const [name, aliases] of Object.entries(table)) {
    for (const spelling of [name, ...aliases]) {
      lookup.set(spelling, { name: name as UnitName, calendar });
    }
  }
}

/**
 * The unit `unit` spells.
 *
 * @throws {RangeError} if `unit` is no unit, e.g. a typo.
 */
export function resolveUnit(unit: Unit): ResolvedUnit {
  const resolved = lookup.get(unit);
  if (resolved === undefined) throw new RangeError(`Chronos: unknown unit ${String(unit)}`);
  return resolved;
}
