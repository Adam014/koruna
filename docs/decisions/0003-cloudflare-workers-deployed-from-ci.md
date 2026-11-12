---
status: accepted
date: 2026-11-12
---

# Host on Cloudflare Workers, deploy from GitHub Actions

## Context and Problem Statement

The app must be online, and it needs a server endpoint for CNB (ADR 0001).
A broken commit must not reach production.

## Considered Options

- One Cloudflare Worker with static assets, deployed by the CI workflow
- Cloudflare Pages with a Pages Function
- Workers Builds (Cloudflare's Git integration)
- Manual `wrangler deploy`

## Decision Outcome

Chosen option: "One Worker with static assets, deployed by the CI workflow",
because Cloudflare recommends Workers over Pages for new projects, one Worker
serves both the SPA and `/api/*`, and deploying from the same workflow that
runs the checks means production changes only after every check passes.
Workers Builds could run the tests in its build command, but then the checks
would live in two systems (GitHub for pull requests, Cloudflare for deploys)
that must be kept in step; a manual deploy is neither reproducible nor
visible in the repo.

The `deploy` job runs on `main` after `verify`, deploys exactly the build that
was tested, and smoke tests https://momence.stadnik.dev. Its secrets live in
the GitHub environment `production`, so only that job can read them.

### Consequences

- Good, because the Worker runs locally inside Vite (`@cloudflare/vite-plugin`),
  in the same runtime as in production. The end-to-end test serves
  `/api/rates` from a fixture, so the Worker itself is covered by its own
  tests in workerd and by the smoke test after each deploy.
- Good, because the custom domain gets DNS and TLS from Cloudflare.
- Bad, because there are no per-PR preview deployments.
- Bad, because the zone needs a Cache Rule ("respect origin TTL"); without it
  Cloudflare rewrites the Worker's `max-age` to 4 hours.

## More Information

- Pages vs Workers: https://developers.cloudflare.com/pages/
- Static assets, SPA routing: https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/
- Custom Domains: https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
- Vite plugin: https://developers.cloudflare.com/workers/vite-plugin/
- Workers Builds, build and deploy commands: https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
- GitHub Actions: https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/
- GitHub Actions security: https://docs.github.com/en/actions/reference/security/secure-use
