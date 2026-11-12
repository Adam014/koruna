---
name: new-adr
description: Write a new Architecture Decision Record in docs/decisions/ using the MADR 4 minimal template, with cited sources. Use when a hard-to-reverse decision is made or an existing ADR is superseded.
---

# Write an ADR

Only for decisions that are hard to reverse or that a reviewer would question
(data source, hosting, caching, money handling, tooling). Not for routine choices.

## Steps

1. List `docs/decisions/` and take the next number: `NNNN-short-title.md`
   (four digits, lowercase, hyphens). Numbers are never reused.
2. Fill the template below. Keep it under one page: two to three sentences of
   context, the real options that were considered, the decision and its trade-offs.
3. Every factual claim (version, default, limit, behaviour) links to its primary
   source in **More Information**. Take sources from `docs/research/` when present,
   otherwise check the official docs. Never cite from memory.
4. To change a past decision, do not edit it: write a new ADR and set the old
   one's status to `superseded by NNNN`.
5. Add the ADR to the decisions list in `README.md`.

## Template (MADR 4 minimal, plus front matter and More Information from the full template)

```markdown
---
status: accepted
date: YYYY-MM-DD
---

# {Short title of the problem and the chosen solution}

## Context and Problem Statement

{Two to three sentences. Make the scope explicit.}

## Considered Options

- {Option 1}
- {Option 2}

## Decision Outcome

Chosen option: "{Option 1}", because {justification}.

### Consequences

- Good, because {…}
- Bad, because {…}

## More Information

- {Source title}: {URL}
```

Template source: https://github.com/adr/madr (MADR 4.0.0).
