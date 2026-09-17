import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";

/**
 * Drizzle over the `DB` D1 binding (wrangler.jsonc). `astro dev` runs in workerd via
 * the Cloudflare Vite plugin, so this is a local D1 under `.wrangler/state` there;
 * `bun run db:migrate` and `bun run db:seed` fill it.
 */
export const db = drizzle(env.DB);
