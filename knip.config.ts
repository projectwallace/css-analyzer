import type { KnipConfig } from 'knip'

const config: KnipConfig = {
	entry: ['src/index.ts'],
	project: ['src/**/*.ts'],
	ignoreDependencies: ['prettier'],
}

export default config
