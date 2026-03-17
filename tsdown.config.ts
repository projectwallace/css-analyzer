import { defineConfig } from 'tsdown'
import { codecovRollupPlugin } from '@codecov/rollup-plugin'

export default defineConfig({
	entry: 'src/index.ts',
	platform: 'neutral',
	publint: true,
	plugins: [
		codecovRollupPlugin({
			enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
			bundleName: 'analyzeCss',
			uploadToken: process.env.CODECOV_TOKEN,
		}),
	],
})
