---
status: accepted
---

# Event content lives in git, D1 stores only Rsvps

Events (title, dates, place, program, slots and their seat capacity) are Astro content
collection entries under `src/content/events/<tenant>/<slug>`, edited in git and shipped with
the Worker. Cloudflare D1 holds a single `rsvp` table keyed by tenant + event slug + guest
e-mail. Only the Organizer writes events and there is no admin UI for them, so a database
row buys nothing over a typed frontmatter file, while guest answers are the only state that
changes at runtime.

## Considered options

- **Everything in D1** (the previous Next.js/Prisma/Turso model with Event, EventDetails,
  EventContact, EventSlot tables): needs migrations and seeds for data that changes once per
  party, and an admin UI to be editable.
- **Everything static**: impossible, the invitation page shows live seat counts and the
  Guest's own booking without client-side JS.

## Consequences

- Slot ids in D1 are strings from frontmatter; renaming a slot or event orphans its Rsvps.
- Adding an event is a commit and a deploy, not a database change.
