import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { codecovVitePlugin } from '@codecov/vite-plugin'

export default defineConfig({
	build: {
		lib: {
			entry: resolve(__dirname, 'src/index.ts'),
			formats: ['es'],
		},
		rollupOptions: {
			// make sure to externalize deps that shouldn't be bundled
			// into your library
			external: ['@projectwallace/css-parser'],
		},
	},
	plugins: [
		dts({
			rollupTypes: true,
		}),
		codecovVitePlugin({
			enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
			bundleName: 'analyzeCss',
			uploadToken: process.env.CODECOV_TOKEN,
		}),
	],
})
