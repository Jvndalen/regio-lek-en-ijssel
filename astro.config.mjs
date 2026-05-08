import node from "@astrojs/node";
import react from "@astrojs/react";
import { defineConfig, fontProviders, memoryCache } from "astro/config";
import { fileURLToPath } from "node:url";
import emdash, { local } from "emdash/astro";
import { sqlite, postgres } from "emdash/db";
import { resendPlugin } from "@regio-lek-en-ijssel/plugin-resend";
import { embedsPlugin } from "@emdash-cms/plugin-embeds";
import { formsPlugin } from "@emdash-cms/plugin-forms";

const database = process.env.DATABASE_URL
  ? postgres({ connectionString: process.env.DATABASE_URL })
  : sqlite({ url: "file:./data/data.db" });

export default defineConfig({
	output: "server",
	adapter: node({
		mode: "standalone",
	}),
	image: {
		layout: "constrained",
		responsiveStyles: true,
	},
	integrations: [
		react(),
		emdash({
			database: database,
			storage: local({
				directory: "./uploads",
				baseUrl: "/_emdash/api/media/file",
			}),
			plugins: [resendPlugin(), embedsPlugin(), formsPlugin()],
			siteUrl: process.env.BASE_URL,
			mcp: true,
		}),
	],
	fonts: [
		{
			provider: fontProviders.google(),
			name: "Nunito",
			cssVariable: "--font-display",
			weights: [400, 600, 700, 800, 900],
			fallbacks: ["sans-serif"],
		},
		{
			provider: fontProviders.google(),
			name: "Nunito",
			cssVariable: "--font-sans",
			weights: [400, 600, 700, 800, 900],
			fallbacks: ["sans-serif"],
		},
		{
			provider: fontProviders.google(),
			name: "JetBrains Mono",
			cssVariable: "--font-mono",
			weights: [400, 500],
			fallbacks: ["monospace"],
		},
  ],
  vite: {
    resolve: {
       alias: {
            "emdash/db/sqlite": fileURLToPath(
             new URL("./src/db/bun-sqlite.ts", import.meta.url),
           ),
      },
    },
  },
	devToolbar: { enabled: false },
	experimental: {
		cache: {
			provider: memoryCache(),
		},
	},
});
