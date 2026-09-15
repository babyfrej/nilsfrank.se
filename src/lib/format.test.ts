import { describe, expect, test } from "bun:test";
import { formatEventDate, formatSlotTimes } from "./format";

describe("formatEventDate", () => {
	test("spells out a date in Swedish", () => {
		expect(formatEventDate("2026-10-17")).toBe("lördag 17 oktober 2026");
	});
});

describe("formatSlotTimes", () => {
	test("renders a Slot as a start–end time range in Swedish local time", () => {
		expect(
			formatSlotTimes("2026-10-17T14:00:00+02:00", "2026-10-17T15:30:00+02:00"),
		).toBe("14:00–15:30");
	});

	test("converts other offsets to Europe/Stockholm", () => {
		expect(
			formatSlotTimes("2026-10-17T12:00:00Z", "2026-10-17T13:30:00Z"),
		).toBe("14:00–15:30");
		// Winter time: UTC+1
		expect(
			formatSlotTimes("2026-12-05T12:00:00Z", "2026-12-05T13:00:00Z"),
		).toBe("13:00–14:00");
	});
});
