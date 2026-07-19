import type { KnipConfig } from 'knip'

const config: KnipConfig = {
	project: ['src/**/*.ts'],
	ignoreDependencies: ['@projectwallace/preset-oxlint'],
}

export default config
