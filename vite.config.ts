import { defineConfig } from "vite";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	root: ".",
	base: "/dist/",
	build: {
		outDir: "public/dist",
		emptyOutDir: true,
		rollupOptions: {
			input: resolve(__dirname, "src/main.ts"),
			output: {
				entryFileNames: "app.js",
				format: "iife",
			},
		},
	},
	server: {
		port: 8778,
		open: true,
	},
});
