import { describe, expect, test } from "bun:test";
import { slotTotals } from "./rsvp";

const slots = [
	{ id: "eftermiddag", seats: 4 },
	{ id: "kvall", seats: 2 },
];

const rsvp = (
	slotId: string | null,
	adults: number,
	children: number,
	attending = true,
) => ({ slotId, adults, children, attending });

describe("slotTotals", () => {
	test("attaches adults + children of attending Rsvps to each Slot, in Slot order", () => {
		expect(
			slotTotals(slots, [
				rsvp("eftermiddag", 2, 1),
				rsvp("kvall", 1, 0),
				rsvp("eftermiddag", 1, 0),
			]),
		).toEqual([
			{ id: "eftermiddag", seats: 4, booked: 4, overbooked: false },
			{ id: "kvall", seats: 2, booked: 1, overbooked: false },
		]);
	});

	test("a Slot without Rsvps has zero booked", () => {
		expect(slotTotals(slots, [])).toEqual([
			{ id: "eftermiddag", seats: 4, booked: 0, overbooked: false },
			{ id: "kvall", seats: 2, booked: 0, overbooked: false },
		]);
	});

	test("excludes declines even when they still carry a slot and headcount", () => {
		const totals = slotTotals(slots, [
			rsvp("kvall", 2, 2, false),
			rsvp(null, 1, 0, false),
		]);
		expect(totals.map((t) => t.booked)).toEqual([0, 0]);
	});

	test("flags a Slot as overbooked once booked exceeds seats, not at exactly full", () => {
		const totals = slotTotals(slots, [
			rsvp("kvall", 1, 1),
			rsvp("eftermiddag", 2, 3),
		]);
		expect(totals).toEqual([
			{ id: "eftermiddag", seats: 4, booked: 5, overbooked: true },
			{ id: "kvall", seats: 2, booked: 2, overbooked: false },
		]);
	});

	test("ignores Rsvps pointing at a Slot the Event no longer has", () => {
		const totals = slotTotals(slots, [rsvp("morgon", 3, 3)]);
		expect(totals.map((t) => t.booked)).toEqual([0, 0]);
	});
});
