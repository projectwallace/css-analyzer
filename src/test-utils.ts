import { summarize_numbers } from './engine/summary.js'
import type { CountResult } from './engine/types.js'

export type PlainCount = {
	total: number
	total_unique: number
	unique: Record<string, number>
	by_context?: Record<string, PlainCount>
	formats?: PlainCount
}

/**
 * A count result as a plain object, so tests can compare it with `toEqual()`:
 * `unique` is a record of counts, and per-property counts and formats are plain too.
 */
export function plain(
	result: CountResult & { by_context?: Map<string, CountResult>; formats?: CountResult },
): PlainCount {
	const counted: PlainCount = {
		total: result.total,
		total_unique: result.total_unique,
		unique: Object.fromEntries([...result.unique].map(([item, { count }]) => [item, count])),
	}
	if (result.by_context && result.by_context.size > 0) {
		counted.by_context = Object.fromEntries(
			[...result.by_context].map(([context, counts]) => [context, plain(counts)]),
		)
	}
	if (result.formats) counted.formats = plain(result.formats)
	return counted
}

export type Series = PlainCount & {
	min: number
	max: number
	mean: number
	mode: number
	range: number
	sum: number
	/** The numbers in the order they were found (needs `sequence: true`) */
	items: number[]
}

/** A series of counted numbers with its statistics, like 9.x reported them */
export function series(result: CountResult): Series {
	const { min, max, mean, mode, range, sum } = summarize_numbers(result)
	return {
		min,
		max,
		mean,
		mode,
		range,
		sum,
		items: (result.sequence ?? []).map(Number),
		...plain(result),
	}
}
