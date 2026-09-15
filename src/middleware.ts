import { defineMiddleware } from "astro:middleware";
import {
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
 */
export const onRequest = defineMiddleware((context, next) => {
	// The internal tenant tree is never addressable from the outside.
	if (isInternalTenantPath(context.url.pathname)) {
		return new Response("Not found", { status: 404 });
	}

	const host = context.request.headers.get("host") ?? "";
	const tenant = resolveTenant(host);

	if (!tenant) return next();

	context.locals.tenant = tenant;
	// `next(path)` rewrites without re-running this middleware (unlike `context.rewrite`),
	// so the internal path is never seen by the guard above.
	return next(
		`${TENANTS_PATH}/${tenant}${context.url.pathname}${context.url.search}`,
	);
});
