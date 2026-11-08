import { summarize_frequencies } from '../engine/summary.ts'
import type { CollectorDef, CountOptions, CountResult } from '../engine/types.ts'
import { compare_specificity, get_specificity, type Specificity } from '../selectors/specificity.ts'
import { define_counting_collector } from './shared.ts'

export type SpecificitySummary = {
	/** Number of selectors */
	total: number
	min: Specificity
	max: Specificity
	sum: Specificity
	mean: Specificity
	mode: Specificity
}

/**
 * Specificity of every selector (keyframe selectors are left out), counted as `"a,b,c"`.
 * Use `summarize_specificity()` for min, max, mean, ... of a result.
 */
export function specificity(options: CountOptions = {}): CollectorDef<CountResult> {
	return define_counting_collector(options, function setup(counter) {
		return {
			selector(node, ctx) {
				if (ctx.in_keyframes) {
					return
				}
				counter.add(get_specificity(node)[0]!.join(','), ctx)
			},
		}
	})
}

/** Derive min, max, sum, mean and mode from a `specificity()` result. Works on merged results too. */
export function summarize_specificity(counts: CountResult): SpecificitySummary {
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
