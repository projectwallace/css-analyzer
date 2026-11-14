import { create_counter } from '../engine/counter.ts'
import { define_collector } from '../engine/define-collector.ts'
import { summarize_frequencies } from '../engine/summary.ts'
import type { CollectorDef, CountOptions, CountResult } from '../engine/types.ts'
import { compare_specificity, get_specificity, type Specificity } from '../selectors/specificity.ts'

declare const specificity_brand: unique symbol

/** The result of `specificity()`: `"a,b,c"` items. The brand is type-only, there is no such property at runtime */
export type SpecificityResult = CountResult & { readonly [specificity_brand]: true }

export type SpecificitySummary = {
	/** Number of selectors */
	total: number
	min: Specificity
	max: Specificity
	sum: Specificity
	mean: Specificity
	mode: Specificity
}

/** Specificity of every selector, counted as `"a,b,c"`; see `summarize_specificity()` */
export function specificity(options: CountOptions = {}): CollectorDef<SpecificityResult> {
	return define_collector<SpecificityResult>(function init() {
		const counter = create_counter(options)
		return {
			selector(node) {
				counter.add(get_specificity(node)[0]!.join(','), node)
			},
			// The brand is type-only: the runtime value is a plain count result
			result: () => counter.result() as SpecificityResult,
		}
	})
}

/** Derive min, max, sum, mean and mode from a `specificity()` result. */
export function summarize_specificity(counts: SpecificityResult): SpecificitySummary {
	const parts: [Map<number, number>, Map<number, number>, Map<number, number>] = [
		new Map(),
		new Map(),
		new Map(),
	]
	let min: Specificity | undefined
	let max: Specificity | undefined

	for (const [item, { count }] of counts.unique) {
		const value = item.split(',').map(Number) as Specificity
		for (let i = 0; i < 3; i++) {
			parts[i]!.set(value[i]!, (parts[i]!.get(value[i]!) ?? 0) + count)
		}
		if (min === undefined || compare_specificity(value, min) < 0) {
			min = value
		}
		if (max === undefined || compare_specificity(value, max) > 0) {
			max = value
		}
	}

	const [a, b, c] = parts.map((frequencies) => summarize_frequencies(frequencies)) as [
		ReturnType<typeof summarize_frequencies>,
		ReturnType<typeof summarize_frequencies>,
		ReturnType<typeof summarize_frequencies>,
	]
	return {
		total: counts.total,
		min: min ?? [0, 0, 0],
		max: max ?? [0, 0, 0],
		sum: [a.sum, b.sum, c.sum],
		mean: [a.mean, b.mean, c.mean],
		mode: [a.mode, b.mode, c.mode],
	}
}
