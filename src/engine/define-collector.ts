import type { CollectorDef, CollectorInstance } from './types.ts'

/** Define a collector; `init` runs once per `analyze()` */
export function define_collector<T>(init: () => CollectorInstance<T>): CollectorDef<T> {
	return { create: init }
}
