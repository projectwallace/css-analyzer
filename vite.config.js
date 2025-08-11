import { resolve } from "path"
import { defineConfig } from "vite"
import dts from "vite-plugin-dts"
import { codecovVitePlugin } from "@codecov/vite-plugin"

export default defineConfig({
	build: {
		target: "esnext",
		lib: {
			entry: resolve(__dirname, "src/index-new.ts"),
			formats: ['es'],
		},
		rollupOptions: {
			// make sure to externalize deps that shouldn't be bundled
			// into your library
			external: [
				"css-tree/parser",
				"css-tree/walker",
				"@bramus/specificity/core",
			],
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
	test: {
		include: ['**/*.test.ts'],
	}
})