@AGENTS.md

## Claude Code

- Skills: `/review-change` before every commit proposal, `/new-adr` for decisions.
- Hooks in `.claude/settings.json`: Prettier runs on every edited file, and
  `bun run typecheck` must pass before a turn can end.
- Deny rules block reading `.env*` / `.dev.vars*`, `git push` and deploys.
- `.claude/settings.local.json` and `CLAUDE.local.md` are personal and gitignored.
