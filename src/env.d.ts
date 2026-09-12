import type { Tenant } from "./lib/tenant";

declare global {
	namespace App {
		interface Locals {
			/** Resolved from the request host by `src/middleware.ts`; unset on non-tenant hosts. */
			tenant?: Tenant;
		}
	}
}
