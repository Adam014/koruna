---
name: review-change
description: Review the uncommitted change in Koruna before a commit is proposed. Checks the diff against docs/requirements.md, the ADRs, AGENTS.md and the research report, verifies uncertain claims against official docs, and runs the project checks. Use before every commit proposal or when the user asks for a review ("pitva").
---

# Review a change before committing

Goal: catch what a senior reviewer would catch, before they do.
Report only real problems you can point to in the diff; no speculation.

## Steps

1. Look at the change: `git status --short` and `git diff` (plus new files).
2. Run the checks and note any failure:
   `bun run typecheck`, `bun run lint`, `bun run format:check`,
   `bun run test:coverage`, `bun run build`.
   If `wrangler.jsonc` changed, also `bunx wrangler types --check`.
3. Check the diff against, in this order:
   - `docs/requirements.md` – does it serve a requirement (R1–R7)? Anything out of scope?
   - `docs/decisions/` – does it contradict an ADR? Does it need a new one?
   - `AGENTS.md` – domain rules (CNB `Amount`, header date, weekend fallback,
     CORS), conventions and UI rules.
   - `docs/research/reports/` (if present) – is the tooling or pattern still the
     recommended one?
4. Look for the usual senior-level issues: correctness and edge cases, error
   handling, caching headers, security (secrets, open proxies, CSP), accessibility,
   dead code, unnecessary dependencies or abstractions, missing tests for logic.
   Tests must assert behaviour (would they fail if the code were wrong?), not
   just raise coverage.
5. **Verify, don't guess.** For every claim about a version, default, API or
   config option you are not certain of, check the official docs, the package's
   own schema/types in `node_modules`, or the npm registry. Say which source.

6. **Independent review** (find, then verify –
   [Anthropic: Code Review](https://code.claude.com/docs/en/code-review)):
   1. Run two `review-finder` subagents in parallel with the same brief: the
      scope ("review the uncommitted change") and how the code will be used.
      Never add your own conclusions, and never pass a `model` override.
   2. Merge their candidates into one numbered list (drop exact duplicates;
      note when both found the same thing).
   3. Run one `review-verifier` with the same brief plus the merged list.
   4. Fix every confirmed finding. If you disagree with one, reproduce it and
      give the evidence; do not drop it silently.

## Report (short)

- **OK** – what is in line with the requirements and standards (one line each).
- **Problems** – ordered by severity; each with file, why it matters, and the fix.
- **Independent review** – each finding: fixed, or rejected and why.
- **Verified** – what you checked and where.
- **Deferred** – what is consciously left for later, and why.
- Proposed commit message (Conventional Commits). Do not commit until the human
  approves.
