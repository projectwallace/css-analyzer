/** `T` with every `Map` replaced by a plain object keyed by the map's keys (as strings) */
export type Json<T> =
	T extends Map<infer _K, infer V>
		? { [key: string]: Json<V> }
		: T extends readonly (infer U)[]
			? Json<U>[]
			: T extends object
				? { [K in keyof T]: Json<T[K]> }
				: T

/**
 * A copy of a result that `JSON.stringify()` can serialize: every `Map` (`unique`, `by_context`, ...)
 * becomes a plain object, at any depth. Arrays and other values are kept (arrays are copied).
 * Use it to send results between workers, store them or snapshot them.
 */
export function to_json<T>(value: T): Json<T> {
	if (value instanceof Map) {
		const entries: [string, unknown][] = []
		for (const [key, entry] of value) {
			entries.push([String(key), to_json(entry)])
		}
		return Object.fromEntries(entries) as Json<T>
	}
	if (Array.isArray(value)) {
		return value.map((item) => to_json(item)) as Json<T>
	}
	if (value !== null && typeof value === 'object') {
		const copy: Record<string, unknown> = {}
		for (const key of Object.keys(value)) {
			copy[key] = to_json((value as Record<string, unknown>)[key])
		}
		return copy as Json<T>
	}
	return value as Json<T>
}
