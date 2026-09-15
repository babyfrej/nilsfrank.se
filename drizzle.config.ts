import { defineConfig } from "drizzle-kit";

/** Migrations land in wrangler's `migrations_dir` (see wrangler.jsonc) and are applied with wrangler, not drizzle-kit. */
export default defineConfig({
	dialect: "sqlite",
	schema: "./src/db/schema.ts",
	out: "./drizzle",
});
