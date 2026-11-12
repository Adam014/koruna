---
status: accepted
date: 2026-11-12
---

# Money as a float, rounded once by Intl

## Context and Problem Statement

The converter turns an amount in CZK into another currency. Binary floats
cannot represent most decimal fractions (`0.1 + 0.2`), and some currencies
have no minor unit (JPY).

## Considered Options

- `number` with one operation, rounded once when displayed by `Intl.NumberFormat`
- A decimal library (decimal.js, dinero.js)
- Integer minor units

## Decision Outcome

Chosen option: "`number`, rounded once by `Intl.NumberFormat`", because the
conversion is one operation, `czk * amount / rate`, and the result is only
displayed. `Intl.NumberFormat` with `style: "currency"` uses the ISO 4217
number of decimals (none for JPY) without extra code. Minor units do not fit
a rate with three decimals and a result in another currency. A decimal
library would make sense for accounting or chained operations.

### Consequences

- Good, because there is no dependency and no rounding code of our own.
- Good, because CNB's `Amount` column (rates per 100 or 1000 units) is handled
  in the one formula and covered by tests.
- Bad, because a future feature that sums or chains amounts would need to
  revisit this.

## More Information

- MDN, Intl.NumberFormat: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat
- MDN, Number.prototype.toFixed (float rounding): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toFixed
