import { expect, test } from "bun:test";
import { eventId, eventSlug } from "./event";

test("eventId and eventSlug round-trip the `<tenant>/<slug>` entry id", () => {
	expect(eventId("frej", "kalas")).toBe("frej/kalas");
	expect(eventSlug({ id: "frej/kalas", data: { tenant: "frej" } })).toBe(
		"kalas",
	);
});
