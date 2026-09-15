import { describe, expect, test } from "bun:test";
import { normaliseRsvp, slotTotals } from "./rsvp";

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

describe("normaliseRsvp", () => {
	const input = {
		attending: true,
		slotId: "kvall",
		email: " Anna@Example.com ",
		name: " Anna ",
		adults: 2,
		children: 1,
		notes: "Nötallergi",
	};

	test("returns a row-ready object with trimmed name and notes and a lower-cased e-mail", () => {
		expect(normaliseRsvp(input, slots)).toEqual({
			row: {
				email: "anna@example.com",
				name: "Anna",
				slotId: "kvall",
				attending: true,
				adults: 2,
				children: 1,
				notes: "Nötallergi",
			},
		});
	});

	test("defaults to one adult, no children and no notes when left out", () => {
		const { row } = normaliseRsvp(
			{ ...input, adults: undefined, children: undefined, notes: "" },
			slots,
		);
		expect(row).toMatchObject({ adults: 1, children: 0, notes: null });
	});

	test("a decline clears the Slot even when one was picked", () => {
		const { row } = normaliseRsvp({ ...input, attending: false }, slots);
		expect(row).toMatchObject({ attending: false, slotId: null });
	});

	test("attending requires a Slot the Event has", () => {
		expect(normaliseRsvp({ ...input, slotId: undefined }, slots)).toEqual({
			errors: { slotId: expect.any(String) },
		});
		expect(normaliseRsvp({ ...input, slotId: "morgon" }, slots)).toEqual({
			errors: { slotId: expect.any(String) },
		});
	});

	test("rejects fewer than one adult and negative children, reporting every field at once", () => {
		expect(normaliseRsvp({ ...input, adults: 0, children: -1 }, slots)).toEqual(
			{
				errors: { adults: expect.any(String), children: expect.any(String) },
			},
		);
	});
});
