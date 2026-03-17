import type { KnipConfig } from 'knip'

const config: KnipConfig = {
	project: ['src/**/*.ts'],
	ignoreDependencies: ['prettier', '@vitest/coverage-v8'],
}

export default config
