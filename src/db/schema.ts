import { sql } from "drizzle-orm";
import {
	integer,
	primaryKey,
	sqliteTable,
	text,
} from "drizzle-orm/sqlite-core";

/**
 * The only table (ADR 0001): one Rsvp per household per Event, keyed by the
 * Tenant, the Event slug and the Guest's e-mail. `slotId` is a Slot id from the
 * Event's frontmatter, null for a decline. Timestamps are ISO strings in UTC.
 */
export const rsvp = sqliteTable(
	"rsvp",
	{
		tenant: text().notNull(),
		event: text().notNull(),
		email: text().notNull(),
		name: text().notNull(),
		slotId: text("slot_id"),
		attending: integer({ mode: "boolean" }).notNull(),
		adults: integer().notNull(),
		children: integer().notNull(),
		notes: text(),
		createdAt: text("created_at")
			.notNull()
			.default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
		updatedAt: text("updated_at")
			.notNull()
			.default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
	},
	(table) => [
		primaryKey({ columns: [table.tenant, table.event, table.email] }),
	],
);

export type Rsvp = typeof rsvp.$inferSelect;
