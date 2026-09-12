import { defineMiddleware } from "astro:middleware";
import { isTenantPath, resolveTenant } from "./lib/tenant";

// Bare `localhost` has no subdomain; fall back so `astro dev` works out of the box.
// Use `frej.localhost:4321` / `helge.localhost:4321` to exercise a specific tenant.
const DEV_FALLBACK_TENANT = "frej";

/**
 * Multi-tenancy by host: `frej.nilsfrank.se` serves `src/pages/frej/**`,
 * `helge.nilsfrank.se` serves `src/pages/helge/**`. The tenant is exposed on
 * `Astro.locals.tenant` for pages that need it.
 *
 * Static assets (`/_astro/*`, `public/*`) never reach this middleware: Cloudflare
 * serves them before the Worker (no `run_worker_first`), and Vite does the same in dev.
 */
export const onRequest = defineMiddleware((context, next) => {
	const host = context.request.headers.get("host") ?? "";
	const tenant =
		resolveTenant(host) ??
		(import.meta.env.DEV ? DEV_FALLBACK_TENANT : undefined);

	if (!tenant) {
		return new Response("Unknown tenant", { status: 404 });
	}

	// Tenant directories are internal; never let one tenant's host reach another's pages.
	if (isTenantPath(context.url.pathname)) {
		return new Response("Not found", { status: 404 });
	}

	context.locals.tenant = tenant;
	// `next(path)` rewrites without re-running this middleware (unlike `context.rewrite`),
	// so the internal `/<tenant>/...` path is never seen by the guard above.
	return next(`/${tenant}${context.url.pathname}${context.url.search}`);
});
