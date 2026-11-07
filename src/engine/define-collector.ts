import type { CollectorDef, CollectorInstance } from './types.js'

/**
 * Define a collector. `init` runs once per analyzer and creates a fresh instance with its own
 * state, so the returned definition is reusable and never shares state between runs.
 * `merge` combines two results (from separate analyzers) into one.
 */
export function define_collector<T>(
	init: () => CollectorInstance<T>,
	merge: (a: T, b: T) => T,
): CollectorDef<T> {
	return { create: init, merge }
}
