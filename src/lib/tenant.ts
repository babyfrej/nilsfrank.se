/**
 * Each tenant is a subdomain (`<tenant>.nilsfrank.se`) and a matching page
 * directory (`src/pages/<tenant>/`). The middleware resolves the tenant from
 * the request host and rewrites into that directory, so pages never see the
 * prefix in their URLs.
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

/** True when a public URL tries to hit a tenant directory directly (`/frej/...`). */
export function isTenantPath(pathname: string): boolean {
	const [, first = ""] = pathname.toLowerCase().split("/");
	return isTenant(first);
}
