import cloudflare from "@astrojs/cloudflare";
import { defineConfig, fontProviders } from "astro/config";

// Tenants are resolved per request from the host (see src/middleware.ts), so no
// single `site`/`i18n.domains` is configured here.
export default defineConfig({
	output: "server",
	adapter: cloudflare(),
	vite: {
		// Lets `astro dev` answer for real tenant hosts (e.g. via /etc/hosts), not just *.localhost.
		server: { allowedHosts: [".nilsfrank.se"] },
	},
	i18n: {
		locales: ["sv"],
		defaultLocale: "sv",
		routing: {
			prefixDefaultLocale: false,
		},
	},
	fonts: [
		{
			provider: fontProviders.local(),
			name: "BlueCustard",
			cssVariable: "--font-tertiary",
			options: {
				variants: [
					{
						src: ["./public/fonts/blue-custard.woff"],
						weight: "normal",
						style: "normal",
					},
				],
			},
		},
	],
});
