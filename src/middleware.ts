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
