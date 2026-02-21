export interface Options {
	/**
	 * Only analyze the specified metric groups.
	 * Supports dot-notation for sub-metrics, e.g. `['values.colors', 'selectors.specificity']`.
	 * When omitted, all metrics are analyzed.
	 */
	only?: string[]

	/**
	 * Include raw `items[]` arrays for aggregate metrics (nesting depths, rule sizes, etc.).
	 * Enables histogram / distribution analysis downstream.
	 * @default false
	 */
	samples?: boolean

	/**
	 * Return a parallel `locations` map alongside the main result.
	 * The map has the shape `Record<metricKey, Record<value, Location[]>>`.
	 * When false (default), the main result is smaller and contains counts only.
	 * @default false
	 */
	locations?: boolean

	/**
	 * @deprecated Use `locations` instead.
	 */
	useLocations?: boolean
}

/**
 * Returns true when the given metric key should be analyzed given the `only` list.
 * A key matches when:
 *  - `only` is empty / undefined (run everything)
 *  - an `only` entry equals the key exactly
 *  - an `only` entry is a child of the key  (e.g. only=['values.colors'] → run 'values')
 *  - an `only` entry is a parent of the key (e.g. only=['values'] → run 'values.colors')
 */
export function shouldRun(only: string[] | undefined, key: string): boolean {
	if (!only || only.length === 0) return true
	for (const entry of only) {
		if (entry === key) return true
		if (key.startsWith(entry + '.')) return true
		if (entry.startsWith(key + '.')) return true
	}
	return false
}
