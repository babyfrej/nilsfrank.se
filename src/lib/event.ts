import type { Tenant } from "./tenant";

/**
 * Events are files at `src/content/events/<tenant>/<slug>.md`, so the collection
 * entry id is `<tenant>/<slug>` (spec #1). These two keep that format in one place
 * for the action, the Event page and the Organizer page.
 */
export function eventId(tenant: Tenant, slug: string) {
	return `${tenant}/${slug}`;
}

/** The slug of an Event entry, i.e. its path under the Tenant host. */
export function eventSlug(entry: { id: string; data: { tenant: Tenant } }) {
	return entry.id.slice(entry.data.tenant.length + 1);
}
