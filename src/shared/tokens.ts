/**
 * Splits a dayjs-style format into `[literal]` text, tokens and single
 * characters, longer tokens first. `parse` and `format` share it, so a format
 * written for one reads the same in the other.
 */
export const tokenizer = /\[([^\]]*)]|YYYY|YY|MM?|DD?|HH?|hh?|mm?|ss?|S{1,3}|A|a|./gs;
