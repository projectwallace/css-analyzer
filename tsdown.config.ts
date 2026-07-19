import { defineConfig } from 'tsdown'

export default defineConfig({
	entry: [
		'src/index.ts',
		'src/selectors/index.ts',
		'src/atrules/index.ts',
		'src/values/index.ts',
		'src/properties/index.ts',
	],
	platform: 'neutral',
	publint: true,
})
