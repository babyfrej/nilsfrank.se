import { ActionError, defineAction } from "astro:actions";
import { getEntry } from "astro:content";
import { z } from "astro/zod";
import { sql } from "drizzle-orm";
import { db } from "../db/client";
import { rsvp } from "../db/schema";
import { normaliseRsvp, type RsvpErrors } from "../lib/rsvp";

const integer = z.number({ error: "Ange ett heltal" }).int("Ange ett heltal");

/**
 * Field errors for the page to show next to inputs. Astro does not export
 * `ActionInputError`, but it serialises any `ActionError` by spreading its own
 * fields and deserialises a `type` of `AstroActionInputError` with `issues` back
 * into one, so `isInputError(result.error)` and `error.fields` work on the page.
 */
class RsvpInputError extends ActionError {
	override type = "AstroActionInputError";
	readonly issues: { code: "custom"; path: string[]; message: string }[];

	constructor(errors: RsvpErrors) {
		super({ code: "BAD_REQUEST", message: "Failed to validate" });
		this.issues = Object.entries(errors).flatMap(([field, message]) =>
			message ? [{ code: "custom" as const, path: [field], message }] : [],
		);
	}
}

export const server = {
	rsvp: {
		/**
		 * A Guest's answer to an Event, posted from the plain HTML form on the Event
		 * page. The Tenant comes from locals (set by the middleware from the host),
		 * never from the form. Type checks live in the schema, the domain rules in
		 * `normaliseRsvp`; this only wires the row into D1 and remembers the Guest.
		 */
		submit: defineAction({
			accept: "form",
			input: z.object({
				event: z.string(),
				slotId: z.string().optional(),
				attending: z.boolean(),
				email: z.email({ error: "Ange en giltig e-postadress" }),
				name: z
					.string({ error: "Ange ert namn" })
					.trim()
					.min(1, "Ange ert namn"),
				adults: integer.optional(),
				children: integer.optional(),
				notes: z.string().optional(),
			}),
			handler: async ({ event: slug, ...input }, context) => {
				const tenant = context.locals.tenant;
				if (!tenant) throw new ActionError({ code: "NOT_FOUND" });
				const event = await getEntry("events", `${tenant}/${slug}`);
				if (!event) throw new ActionError({ code: "NOT_FOUND" });

				const { row, errors } = normaliseRsvp(input, event.data.slots);
				if (!row) throw new RsvpInputError(errors);

				// One row per household and Event (spec #1): the primary key is
				// (tenant, event, email), so a resubmit updates in place. `updatedAt` is
				// set here because the column default only applies on insert.
				const { email, ...answer } = row;
				await db
					.insert(rsvp)
					.values({ tenant, event: slug, email, ...answer })
					.onConflictDoUpdate({
						target: [rsvp.tenant, rsvp.event, rsvp.email],
						set: {
							...answer,
							updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
						},
					});

				// Remembers the household on this device so the page can prefill its Rsvp,
				// long enough to outlive the party. The browser scopes the cookie to the
				// Tenant host it was set on.
				context.cookies.set("guest", email, {
					httpOnly: true,
					sameSite: "lax",
					secure: true,
					path: "/",
					maxAge: 60 * 60 * 24 * 365,
				});
			},
		}),
	},
};
