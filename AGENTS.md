# nilsfrank.se

Invitation sites for the family, one subdomain per child (tenant), on Astro + Cloudflare Workers.

## Agent skills

### Issue tracker

Issues and specs live as GitHub Issues on babyfrej/nilsfrank.se, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` glossary and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Local database

Rsvps live in Cloudflare D1 (binding `DB`, schema in `src/db/schema.ts`, ADR 0001). `astro dev`
runs in workerd and uses a local D1 under `.wrangler/state`, which starts empty:

- `bun run db:generate` — regenerate the SQL migration in `drizzle/` after editing the schema
- `bun run db:migrate` — apply pending migrations to the local D1
- `bun run db:seed` — load `seed.sql` (a few Rsvps for the Frej Event; safe to re-run)

Only `.sql` migrations belong in `drizzle/`; wrangler applies every `.sql` file there. Remote
migrations are the Organizer's job at cutover (#7); never run wrangler with `--remote` here.
