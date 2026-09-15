-- Local dev data for the Frej placeholder Event (src/content/events/frej/kalas.md).
-- Apply with `bun run db:seed`; idempotent so it can be re-run after a reset.
DELETE FROM rsvp WHERE tenant = 'frej' AND event = 'kalas';

INSERT INTO rsvp (tenant, event, email, name, slot_id, attending, adults, children, notes) VALUES
  ('frej', 'kalas', 'anna@example.com',  'Familjen Andersson', 'eftermiddag', 1, 2, 1, 'Nötallergi'),
  ('frej', 'kalas', 'bo@example.com',    'Bo & Kim',           'eftermiddag', 1, 1, 2, NULL),
  ('frej', 'kalas', 'cilla@example.com', 'Cilla',              'kvall',       1, 1, 1, NULL),
  ('frej', 'kalas', 'dan@example.com',   'Familjen Dahl',      'kvall',       1, 2, 2, 'Kommer lite sent'),
  ('frej', 'kalas', 'eva@example.com',   'Eva',                NULL,          0, 1, 0, 'Tyvärr bortresta');
