---
layout: home

hero:
  name: Chronos
  text: Extension methods for Temporal
  tagline: "Temporal is the date library. Chronos makes it read left to right, as in Day.js."
  actions:
    - theme: brand
      text: Get started
      link: /guide/
    - theme: alt
      text: API
      link: /api/query

features:
  - title: Reads like a sentence
    details: "Chronos(today).isBefore(deadline) instead of Temporal.PlainDate.compare(today, deadline) < 0."
  - title: Raw Temporal in, raw Temporal out
    details: Only the receiver is wrapped, for one expression. Every date you get back is plain Temporal, so the native chain carries on.
  - title: Units follow the type
    details: A PlainDate takes calendar units, an Instant time units only. TypeScript rejects the rest.
  - title: Copy what you need
    details: Every helper is a few lines over a native Temporal call. Lift the three you want into your project.
---
