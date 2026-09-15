import { describe, expect, test } from "bun:test";
import { normaliseRsvp, rsvpInput, slotTotals } from "./rsvp";

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
	test("sums adults, children and their total for attending Rsvps per Slot, in Slot order", () => {
		expect(
			slotTotals(slots, [
				rsvp("eftermiddag", 2, 1),
				rsvp("kvall", 1, 0),
				rsvp("eftermiddag", 1, 0),
			]),
		).toEqual([
			{
				id: "eftermiddag",
				seats: 4,
				adults: 3,
				children: 1,
				booked: 4,
				overbooked: false,
			},
			{
				id: "kvall",
				seats: 2,
				adults: 1,
				children: 0,
				booked: 1,
				overbooked: false,
			},
		]);
	});

	test("a Slot without Rsvps has zero of everything", () => {
		expect(slotTotals(slots, [])).toEqual([
			{
				id: "eftermiddag",
				seats: 4,
				adults: 0,
				children: 0,
				booked: 0,
				overbooked: false,
			},
			{
				id: "kvall",
				seats: 2,
				adults: 0,
				children: 0,
				booked: 0,
				overbooked: false,
			},
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
			{
				id: "eftermiddag",
				seats: 4,
				adults: 2,
				children: 3,
				booked: 5,
				overbooked: true,
			},
			{
				id: "kvall",
				seats: 2,
				adults: 1,
				children: 1,
				booked: 2,
				overbooked: false,
			},
		]);
	});

	test("ignores Rsvps pointing at a Slot the Event no longer has", () => {
		const totals = slotTotals(slots, [rsvp("morgon", 3, 3)]);
		expect(totals.map((t) => t.booked)).toEqual([0, 0]);
	});
});

describe("rsvpInput", () => {
	// What Astro hands the schema for a plain HTML form: every field a string, an
	// empty or missing input `null` (`undefined` only for `.optional()` fields).
	const form = {
		event: "kalas",
		attending: "true",
		slotId: "kvall",
		email: "anna@example.com",
		name: "Anna",
		adults: "2",
		children: "0",
	};
	const errorFor = (input: Record<string, unknown>) => {
		const result = rsvpInput.safeParse(input);
		return Object.fromEntries(
			(result.error?.issues ?? []).map((i) => [i.path.join("."), i.message]),
		);
	};

	test("turns the submit button value into a boolean and headcounts into numbers", () => {
		expect(rsvpInput.parse(form)).toMatchObject({
			attending: true,
			adults: 2,
			children: 0,
		});
		expect(rsvpInput.parse({ ...form, attending: "false" })).toMatchObject({
			attending: false,
		});
	});

	test("a POST without attending is a field error, never a silent decline", () => {
		expect(errorFor({ ...form, attending: null })).toEqual({
			attending: expect.any(String),
		});
	});

	test("empty or omitted headcounts are left undefined so the defaults apply", () => {
		const parsed = rsvpInput.parse({ ...form, adults: null, children: "" });
		expect(parsed.adults).toBeUndefined();
		expect(parsed.children).toBeUndefined();
	});

	test("an empty e-mail gets the Swedish message, like an invalid one", () => {
		expect(errorFor({ ...form, email: null })).toEqual({
			email: "Ange en giltig e-postadress",
		});
		expect(errorFor({ ...form, email: "anna" })).toEqual({
			email: "Ange en giltig e-postadress",
		});
	});

	test("rejects a headcount that is not a whole number", () => {
		expect(errorFor({ ...form, adults: "1.5", children: "två" })).toEqual({
			adults: "Ange ett heltal",
			children: "Ange ett heltal",
		});
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
