# Expected findings (grader only – reviewers must not read this file)

Each case passes only if the final verified report confirms every expected
finding below. A missing one is a fail. Grade pass/fail, not partially.

## cases/amount-input.ts

Used by a CZK input that converts in real time.

1. A half-typed decimal (`12.`, `12,`) is rejected, so an error flashes while
   the user types a valid amount.
2. `1,250` (English thousands separator) gets "Use at most 2 decimal places",
   which is untrue for that input and does not say what to change.
3. No maximum: a very long number (e.g. 400 digits) is `valid` with value
   `Infinity`. OWASP Input Validation requires min and max for numbers.

## cases/convert-amount.ts

1. Ignores `amount`: rates quoted per 100 (JPY, HUF) or 1000 (IDR) units come
   out 100× or 1000× too small. Must be `czk * amount / rate`.

## cases/fixing-date.ts

1. `new Date('YYYY-MM-DD')` is UTC midnight, but the date is formatted in the
   viewer's local time zone, so west of UTC (e.g. `TZ=America/New_York`) the
   fixing shows the previous day.
