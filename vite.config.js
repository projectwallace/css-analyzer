import { resolve } from "path"
import { defineConfig } from "vite"
import dts from "vite-plugin-dts"
import { codecovVitePlugin } from "@codecov/vite-plugin"

export default defineConfig({
	build: {
		lib: {
			entry: resolve(__dirname, "src/index.js"),
			name: "analyzeCss",
			fileName: "analyze-css",
		},
		rollupOptions: {
			// make sure to externalize deps that shouldn't be bundled
			// into your library
			external: ["css-tree/parser", "css-tree/walker"],
		},
	},
	plugins: [
		dts(),
		codecovVitePlugin({
			enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
			bundleName: "analyzeCss",
			uploadToken: process.env.CODECOV_TOKEN,
		}),
	],
})