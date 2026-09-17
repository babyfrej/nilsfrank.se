/**
 * Each Tenant is a subdomain (`<tenant>.nilsfrank.se`). The middleware resolves
 * the Tenant from the request host and rewrites into `src/pages/tenants/`, where
 * `<tenant>/index.astro` is that Tenant's hand-written landing page and the shared
 * `[tenant]/[slug].astro` renders its Events, so pages never see the prefix in
 * their URLs.
 */
export const TENANTS = ["frej", "helge"] as const;

export type Tenant = (typeof TENANTS)[number];

const isTenant = (value: string): value is Tenant =>
	(TENANTS as readonly string[]).includes(value);

/** Resolves the tenant from a `Host` header value, e.g. `helge.localhost:4321` → `helge`. */
export function resolveTenant(host: string): Tenant | undefined {
	const [hostname = ""] = host.toLowerCase().split(":");
	const labels = hostname.split(".");
	// Needs at least `<tenant>.<domain>`; a bare domain has no tenant.
	if (labels.length < 2) return undefined;
	const [subdomain = ""] = labels;
	return isTenant(subdomain) ? subdomain : undefined;
}

/** Root of the internal page tree that tenant requests are rewritten into. */
export const TENANTS_PATH = "/tenants";

/** True when a public URL tries to hit the internal tenant tree directly (`/tenants/...`). */
export function isInternalTenantPath(pathname: string): boolean {
	const [, first = ""] = pathname.toLowerCase().split("/");
	return `/${first}` === TENANTS_PATH;
}

/** Astro serves Actions called over RPC under this prefix (`/_actions/<name>`). */
const ACTIONS_PATH = "/_actions/";

/**
 * True for Astro's action endpoint. Those requests must not be rewritten into the
 * tenant tree: the route exists only at the root, so a rewrite would 404 every form
 * POST made on a Tenant host.
 */
export function isActionPath(pathname: string): boolean {
	return (
		pathname.startsWith(ACTIONS_PATH) && pathname.length > ACTIONS_PATH.length
	);
}
