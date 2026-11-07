import { defineConfig } from 'vitest/config'

// Runs the 9.x test-suite (written against analyze()) against analyze_compat().
// Tests about `useLocations` are skipped: that option is gone in v10.
export default defineConfig({
	resolve: {
		alias: [
			{
				find: /^\.\.\/index\.js$/,
				replacement: new URL('./src/presets/compat-shim.ts', import.meta.url).pathname,
			},
		],
	},
	test: {
		include: [
			'src/{atrules,declarations,properties,rules,selectors,stylesheet,values}/!(utils).test.ts',
		],
		testNamePattern: '^(?!.*[Ll]ocations)',
	},
})
