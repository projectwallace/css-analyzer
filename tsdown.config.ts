import { defineConfig } from 'tsdown'
import { codecovRollupPlugin } from '@codecov/rollup-plugin'

export default defineConfig({
	entry: [
		'src/index.ts',
		'src/selectors/index.ts',
		'src/atrules/index.ts',
		'src/values/index.ts',
		'src/properties/index.ts'
	],
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
