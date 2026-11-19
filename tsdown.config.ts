import { defineConfig } from 'tsdown'

export default defineConfig({
	// The main entry plus the subpath exports (src/<subpath>/index.ts); the engine is internal
	entry: ['src/index.ts', 'src/*/index.ts', 'src/utils/collections/index.ts'],
	platform: 'neutral',
	publint: true,
	dts: true,
	// JSDoc ships in the .d.ts files, where editors read it; it is not needed in the JavaScript
	outputOptions: { comments: { jsdoc: false } },
})
