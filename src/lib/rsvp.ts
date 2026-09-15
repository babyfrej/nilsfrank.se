import type { Rsvp } from "../db/schema";

/** The Slot fields the totals need; matches the `slots` frontmatter shape. */
type SlotCapacity = { id: string; seats: number };

/** The Rsvp columns the totals need, so callers can pass rows or plain objects. */
type Headcount = Pick<Rsvp, "slotId" | "attending" | "adults" | "children">;

type Totals = {
	/** Adults + children of attending Rsvps for the Slot. */
	booked: number;
	/** Capacity is displayed, never enforced (spec #1), so this only flags. */
	overbooked: boolean;
};

/**
 * Each Slot of an Event with its "booked / seats" attached, in the Event's Slot
 * order, so pages render one list without joining. Declines are excluded, and
 * Rsvps pointing at a Slot the Event no longer has are ignored (a renamed Slot
 * orphans its Rsvps, ADR 0001).
 */
export function slotTotals<Slot extends SlotCapacity>(
	slots: readonly Slot[],
	rsvps: readonly Headcount[],
): (Slot & Totals)[] {
	return slots.map((slot) => {
		const booked = rsvps
			.filter((r) => r.attending && r.slotId === slot.id)
			.reduce((sum, r) => sum + r.adults + r.children, 0);
		return { ...slot, booked, overbooked: booked > slot.seats };
	});
}

/** The Rsvp columns a Guest fills in; the action adds tenant, event and timestamps. */
type RsvpRow = Pick<
	Rsvp,
	"email" | "name" | "slotId" | "attending" | "adults" | "children" | "notes"
>;

/**
 * A submitted Rsvp form after type parsing. `adults`/`children` are optional so
 * the defaults live here, next to the other domain rules, not in the schema.
 */
export type RsvpInput = {
	attending: boolean;
	slotId?: string | undefined;
	email: string;
	name: string;
	adults?: number | undefined;
	children?: number | undefined;
	notes?: string | undefined;
};

export type RsvpErrors = Partial<Record<keyof RsvpInput, string>>;

/**
 * Turns a parsed form submission into a row for the `rsvp` table, or into one
 * Swedish message per offending field for the page to show. Defaults: one adult,
 * no children. Attending needs a Slot the Event has; a decline never keeps a Slot
 * (a Guest may decline with a Slot still picked). The e-mail is lower-cased since
 * it keys the household's row (spec #1).
 */
export function normaliseRsvp(
	input: RsvpInput,
	slots: readonly { id: string }[],
):
	| { row: RsvpRow; errors?: undefined }
	| { row?: undefined; errors: RsvpErrors } {
	const adults = input.adults ?? 1;
	const children = input.children ?? 0;
	const slotId = input.attending ? input.slotId : undefined;

	const errors: RsvpErrors = {};
	if (input.attending && !slotId) errors.slotId = "Välj en tid";
	else if (slotId && !slots.some((s) => s.id === slotId))
		errors.slotId = "Tiden finns inte längre, välj en annan";
	if (adults < 1) errors.adults = "Minst en vuxen";
	if (children < 0) errors.children = "Antal barn kan inte vara negativt";
	if (Object.keys(errors).length > 0) return { errors };

	return {
		row: {
			email: input.email.trim().toLowerCase(),
			name: input.name.trim(),
			slotId: slotId ?? null,
			attending: input.attending,
			adults,
			children,
			notes: input.notes?.trim() || null,
		},
	};
}
