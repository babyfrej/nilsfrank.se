import { ACTION_QUERY_PARAMS } from "astro:actions";
import { defineMiddleware } from "astro:middleware";
import {
	isActionPath,
	isInternalTenantPath,
	resolveTenant,
	TENANTS_PATH,
} from "./lib/tenant";

/**
 * Multi-tenancy by host: `frej.nilsfrank.se` serves `src/pages/tenants/frej/**`,
 * `helge.nilsfrank.se` serves `src/pages/tenants/helge/**`. Hosts without a
 * tenant (e.g. `nilsfrank.se`) fall through to the regular `src/pages` routes,
 * so `nilsfrank.se/helge` is a normal public path there. In dev, `localhost:4321`
 * is the root site and `frej.localhost:4321` / `helge.localhost:4321` the tenants.
 *
 * Static assets (`/_astro/*`, `public/*`) never reach this middleware: Cloudflare
 * serves them before the Worker (no `run_worker_first`), and Vite does the same in dev.
 *
 * Every tenant page is server rendered. Spike (ticket #3, Astro 7.3 + @astrojs/cloudflare
 * 14.3): with `prerender = true` on the landing pages, `next("/tenants/frej/")` throws
 * "Unexpectedly unable to find a component instance for route /tenants/frej" (500), since
 * prerendered routes are not in the server manifest. The prerendered HTML is also served
 * by the assets layer at `nilsfrank.se/tenants/frej/`, bypassing the guard below.
 *
 * Astro Actions run inside `next()`, after this middleware, so `locals.tenant` is set
 * for them too. The HTML form posts to its own page (`/kalas?_action=rsvp.submit`),
 * which is rewritten like any page; only the RPC endpoint `/_actions/*` is passed
 * through untouched. Either way the action reads the Tenant from locals (spec #1).
 */
export const onRequest = defineMiddleware(async (context, next) => {
	// The internal tenant tree is never addressable from the outside.
	if (isInternalTenantPath(context.url.pathname)) {
		return new Response("Not found", { status: 404 });
	}

	const host = context.request.headers.get("host") ?? "";
	const tenant = resolveTenant(host);

	if (!tenant) return next();

	context.locals.tenant = tenant;

	// Astro's form-action flow consumes the request body before the page renders, so
	// a failed submission's values are kept here for the page to prefill the form with.
	if (
		context.request.method === "POST" &&
		context.url.searchParams.has(ACTION_QUERY_PARAMS.actionName)
	) {
		context.locals.submitted = await context.request.clone().formData();
	}

	// Astro's action endpoint (`/_actions/<name>`) is a root route with no counterpart
	// under `/tenants/<tenant>/`; rewriting it would 404 every action call made on a
	// Tenant host. Pass it through with the Tenant already in locals.
	if (isActionPath(context.url.pathname)) return next();

	// `next(path)` rewrites without re-running this middleware (unlike `context.rewrite`),
	// so the internal path is never seen by the guard above.
	return next(
		`${TENANTS_PATH}/${tenant}${context.url.pathname}${context.url.search}`,
	);
});
