import type { KnipConfig } from 'knip'

const config: KnipConfig = {
	project: ['src/**/*.ts'],
	// vitest.compat.config.ts only selects some tests; every *.test.ts is an entry
	vitest: { config: ['vitest.config.*'], entry: ['src/**/*.test.ts'] },
}

export default config
