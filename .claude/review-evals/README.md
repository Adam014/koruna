# Review evals

A small regression set for the review agents (`review-finder`,
`review-verifier`). Each file in `cases/` contains real defects that a review
once missed or must catch; `expected.md` lists them for the grader.

Run it after every change to the review agents (a new session is needed for
agent edits to load):

1. Run the review pipeline from `/review-change` step 6 with the brief
   "Review `.claude/review-evals/cases/<file>` as if it were new code in
   `src/rates/`", once per case.
2. Compare the verifier's **Confirmed** list with `expected.md`. Pass/fail per
   case; read the transcripts, not just the summary.
3. When a review misses a real defect in normal work, add it here as a case.

Approach: [Anthropic – Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
("20-50 simple tasks drawn from real failures is a great start").
