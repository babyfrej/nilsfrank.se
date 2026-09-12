/**
 * Each tenant is a subdomain (`<tenant>.nilsfrank.se`) and a matching page
 * directory under `src/pages/tenants/<tenant>/`. The middleware resolves the
 * tenant from the request host and rewrites into that directory, so pages
 * never see the prefix in their URLs.
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
