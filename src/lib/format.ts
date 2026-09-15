/**
 * Renders Event dates and Slot times for Guests. Frontmatter stores ISO strings
 * (dates as `YYYY-MM-DD`, Slot times with offset); everything is shown in
 * Swedish, in Europe/Stockholm, via `Intl` so no date library is needed.
 */
const TIME_ZONE = "Europe/Stockholm";

const eventDate = new Intl.DateTimeFormat("sv-SE", {
	timeZone: TIME_ZONE,
	weekday: "long",
	day: "numeric",
	month: "long",
	year: "numeric",
});

const slotTime = new Intl.DateTimeFormat("sv-SE", {
	timeZone: TIME_ZONE,
	hour: "2-digit",
	minute: "2-digit",
});

/** `"2026-10-17"` → `"lördag 17 oktober 2026"`. */
export function formatEventDate(isoDate: string): string {
	return eventDate.format(new Date(isoDate));
}

/** Start and end of a Slot as `"14:00–15:30"` in Swedish local time. */
export function formatSlotTimes(isoStart: string, isoEnd: string): string {
	return slotTime.formatRange(new Date(isoStart), new Date(isoEnd));
}

const timestamp = new Intl.DateTimeFormat("sv-SE", {
	timeZone: TIME_ZONE,
	dateStyle: "short",
	timeStyle: "short",
});

/** An Rsvp's `updatedAt` (UTC ISO string from D1) as `"2026-10-01 14:05"` for the Organizer. */
export function formatUpdatedAt(isoTimestamp: string): string {
	return timestamp.format(new Date(isoTimestamp));
}
