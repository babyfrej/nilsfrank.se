import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { TENANTS } from "./lib/tenant";

/** An ISO datetime with offset, e.g. `2026-10-17T14:00:00+02:00`. */
const isoDateTime = z.iso.datetime({ offset: true });

const slot = z
	.object({
		/** Stable id that Rsvps in D1 point at; renaming it orphans them (ADR 0001). */
		id: z.string().min(1),
		start: isoDateTime,
		end: isoDateTime,
		seats: z.int().positive(),
	})
	.refine(({ start, end }) => new Date(end) > new Date(start), {
		message: "Slot end must be after its start",
		path: ["end"],
	});

/**
 * One Event per file under `src/content/events/<tenant>/<slug>.md`, so the entry
 * id is `<tenant>/<slug>` and the slug is the invite path under the Tenant host.
 * The markdown body is the invitation text.
 */
const events = defineCollection({
	loader: glob({ base: "./src/content/events", pattern: "*/*.md" }),
	schema: z.object({
		tenant: z.enum(TENANTS),
		title: z.string().min(1),
		date: z.iso.date(),
		place: z.string().min(1),
		program: z.array(
			z.object({ time: z.string().min(1), text: z.string().min(1) }),
		),
		rsvpBy: z.iso.date(),
		contact: z.object({
			name: z.string().min(1),
			phone: z.string().min(1),
			email: z.email(),
		}),
		slots: z
			.array(slot)
			.min(1)
			.refine(
				(slots) => new Set(slots.map((s) => s.id)).size === slots.length,
				{
					message: "Slot ids must be unique within an Event",
				},
			),
	}),
});

export const collections = { events };
