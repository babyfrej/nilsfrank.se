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
