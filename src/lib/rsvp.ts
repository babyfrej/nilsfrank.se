import { z } from "astro/zod";
import type { Rsvp } from "../db/schema";

/** The Slot fields the totals need; matches the `slots` frontmatter shape. */
type SlotCapacity = { id: string; seats: number };

/** The Rsvp columns the totals need, so callers can pass rows or plain objects. */
type Headcount = Pick<Rsvp, "slotId" | "attending" | "adults" | "children">;

type Totals = {
	/** Headcount of attending Rsvps for the Slot, split as the Organizer plans food. */
	adults: number;
	children: number;
	/** `adults + children`, what Guests see against the seats. */
	booked: number;
	/** Capacity is displayed, never enforced (spec #1), so this only flags. */
	overbooked: boolean;
};

/**
 * Each Slot of an Event with its attending headcount attached, in the Event's
 * Slot order, so pages render one list without joining. Declines are excluded, and
 * Rsvps pointing at a Slot the Event no longer has are ignored (a renamed Slot
 * orphans its Rsvps, ADR 0001).
 */
export function slotTotals<Slot extends SlotCapacity>(
	slots: readonly Slot[],
	rsvps: readonly Headcount[],
): (Slot & Totals)[] {
	return slots.map((slot) => {
		const own = rsvps.filter((r) => r.attending && r.slotId === slot.id);
		const adults = own.reduce((sum, r) => sum + r.adults, 0);
		const children = own.reduce((sum, r) => sum + r.children, 0);
		const booked = adults + children;
		return {
			...slot,
			adults,
			children,
			booked,
			overbooked: booked > slot.seats,
		};
	});
}

/** The Rsvp columns a Guest fills in; the action adds tenant, event and timestamps. */
type RsvpRow = Pick<
	Rsvp,
	"email" | "name" | "slotId" | "attending" | "adults" | "children" | "notes"
>;

/** Astro hands an empty or missing input to these pipes as `null`; parsed directly it is `""`. */
const blank = (value: unknown) =>
	value === "" || value === null ? undefined : value;

/** Form values are strings; Astro only converts them for a bare `z.number()`, so coerce here. */
const headcount = z.preprocess(
	blank,
	z.coerce
		.number({ error: "Ange ett heltal" })
		.int("Ange ett heltal")
		.optional(),
);

/**
 * The Rsvp form as `rsvp.submit` accepts it (spec #1): type checks and Swedish
 * messages only, the domain rules follow in `normaliseRsvp`. `attending` is the
 * value of the submit button pressed, so a POST without it is an error rather
 * than a decline. Headcounts stay optional here so the defaults live with the
 * other domain rules below.
 */
export const rsvpInput = z.object({
	event: z.string(),
	slotId: z.string().optional(),
	attending: z.enum(["true", "false"]).transform((value) => value === "true"),
	email: z.preprocess(blank, z.email({ error: "Ange en giltig e-postadress" })),
	name: z.string({ error: "Ange ert namn" }).trim().min(1, "Ange ert namn"),
	adults: headcount,
	children: headcount,
	notes: z.string().optional(),
});

/** A parsed submission, minus the Event slug the action resolves the entry with. */
export type RsvpInput = Omit<z.infer<typeof rsvpInput>, "event">;

/** Headcount a Guest gets without touching the fields: one adult, no children. */
export const RSVP_DEFAULTS = { adults: 1, children: 0 } as const;

export type RsvpErrors = Partial<Record<keyof RsvpInput, string>>;

/**
 * Turns a parsed form submission into a row for the `rsvp` table, or into one
 * Swedish message per offending field for the page to show. Missing headcounts
 * take `RSVP_DEFAULTS`. Attending needs a Slot the Event has; a decline never keeps a Slot
 * (a Guest may decline with a Slot still picked). The e-mail is lower-cased since
 * it keys the household's row (spec #1).
 */
export function normaliseRsvp(
	input: RsvpInput,
	slots: readonly { id: string }[],
):
	| { row: RsvpRow; errors?: undefined }
	| { row?: undefined; errors: RsvpErrors } {
	const adults = input.adults ?? RSVP_DEFAULTS.adults;
	const children = input.children ?? RSVP_DEFAULTS.children;
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
