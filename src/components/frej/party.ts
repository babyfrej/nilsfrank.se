/**
 * Facts for Frej's dinosaur party, rendered by `src/pages/tenants/frej/index.astro`.
 * TODO: replace placeholder values with the real ones before sending invites.
 */
export const party = {
	name: "Frej",
	age: 5,
	date: "Lördag 17 oktober",
	time: "kl. 14–17",
	place: "Dinosaurievägen 5, Stockholm",
	rsvpBy: "10 oktober",
	rsvpPhone: "070-123 45 67",
	rsvpEmail: "kalas@nilsfrank.se",
	dress: "Kom i dina bästa dino-kläder!",
	program: [
		{ time: "14:00", what: "Dinosaurierna vaknar" },
		{ time: "14:30", what: "Fossilutgrävning" },
		{ time: "15:15", what: "Tårta & saft" },
		{ time: "16:00", what: "Vulkanjakt" },
		{ time: "17:00", what: "Utdöende (hemgång)" },
	],
} as const;

/** Digits-only form for `sms:` / `tel:` links. */
export const phoneHref = (phone: string) => phone.replaceAll(/[^\d+]/g, "");
