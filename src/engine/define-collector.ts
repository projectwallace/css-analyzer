import type { CollectorDef, CollectorInstance } from './types.js'

/**
 * Define a collector. `init` runs once per analyzer and creates a fresh instance with its own
 * state, so the returned definition is reusable and never shares state between runs.
 */
export function define_collector<T>(init: () => CollectorInstance<T>): CollectorDef<T> {
	return { create: init }
}
