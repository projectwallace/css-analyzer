import { create_counter, merge_counts } from '../engine/counter.js'
import { define_collector } from '../engine/define-collector.js'
import type { Counter } from '../engine/counter.js'
import type { CollectorDef, CollectorInstance, CountOptions, CountResult } from '../engine/types.js'

export type Normalize = 'lowercase' | 'none'

/** Properties whose values are never searched for colors, gradients, ... (names, timing, numbers) */
export const NO_VALUE_WALK: ReadonlySet<string> = new Set([
	'font-family',
	'transition',
	'animation',
	'z-index',
])

/** Lowercase, except for values with var(): their fallbacks can hold case-sensitive names */
export function lowercase_unless_var(text: string): string {
	const lower = text.toLowerCase()
	return lower.includes('var(') ? text : lower
}

/**
 * Most collectors just count strings: this wires a counter to a handler set
 * and returns the standard count result.
 */
export function define_counting_collector(
	options: CountOptions,
	setup: (counter: Counter) => Omit<CollectorInstance<CountResult>, 'result'>,
): CollectorDef<CountResult> {
	return define_collector<CountResult>(function init() {
		const counter = create_counter(options)
		return { ...setup(counter), result: () => counter.result() }
	}, merge_counts)
}
