import type { CountResult } from './types.js'

export type NumberSummary = {
	total: number
	min: number
	max: number
	range: number
	sum: number
	mean: number
	/** The most common value; the mean of the values that tie for most common */
	mode: number
	median: number
}

const EMPTY: NumberSummary = {
	total: 0,
	min: 0,
	max: 0,
	range: 0,
	sum: 0,
	mean: 0,
	mode: 0,
	median: 0,
}

/**
 * Statistics for numbers that were counted as `value -> how often`.
 * Keeping counts (instead of a mean) keeps every statistic derivable afterwards.
 */
export function summarize_frequencies(frequencies: ReadonlyMap<number, number>): NumberSummary {
	const values = [...frequencies.keys()].sort((a, b) => a - b)
	if (values.length === 0) {
		return { ...EMPTY }
	}

	let total = 0
	let sum = 0
	let most_common = 0
	for (const value of values) {
		const count = frequencies.get(value)!
		total += count
		sum += value * count
		most_common = Math.max(most_common, count)
	}

	let mode_sum = 0
	let mode_count = 0
	for (const value of values) {
		if (frequencies.get(value) === most_common) {
			mode_sum += value
			mode_count++
		}
	}

	// Walk the sorted values until we reach the middle one(s)
	const lower_index = Math.floor((total - 1) / 2)
	const upper_index = Math.floor(total / 2)
	let seen = 0
	let lower = 0
	let upper = 0
	for (const value of values) {
		const next = seen + frequencies.get(value)!
		if (seen <= lower_index && lower_index < next) {
			lower = value
		}
		if (seen <= upper_index && upper_index < next) {
			upper = value
		}
		seen = next
	}

	const min = values[0]!
	const max = values.at(-1)!
	return {
		total,
		min,
		max,
		range: max - min,
		sum,
		mean: sum / total,
		mode: mode_sum / mode_count,
		median: (lower + upper) / 2,
	}
}

/** Statistics for a count result whose items are numbers (e.g. nesting depths, complexities) */
export function summarize_numbers(counts: CountResult): NumberSummary {
	const frequencies = new Map<number, number>()
	for (const [item, { count }] of counts.unique) {
		const value = Number(item)
		frequencies.set(value, (frequencies.get(value) ?? 0) + count)
	}
	return summarize_frequencies(frequencies)
}
