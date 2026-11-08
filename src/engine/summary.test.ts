import { test, expect } from 'vitest'
import { create_counter } from './counter.js'
import { summarize_frequencies, summarize_numbers } from './summary.js'

const at = { loc: { line: 1, column: 1, offset: 0, length: 1 } }

function count(values: number[]) {
	const counter = create_counter<number>()
	for (const value of values) {
		counter.add(value, at)
	}
	return counter.result()
}

// Expected values are the aggregates the 9.x analyzer produced for the same numbers
const samples: [number[], Omit<ReturnType<typeof summarize_numbers>, 'total' | 'median'>][] = [
	[[1, 2, 25, 3, 4, 4], { min: 1, max: 25, range: 24, mean: 39 / 6, mode: 4, sum: 39 }],
	[[5], { min: 5, max: 5, range: 0, mean: 5, mode: 5, sum: 5 }],
	[[1, 1, 2, 2], { min: 1, max: 2, range: 1, mean: 1.5, mode: 1.5, sum: 6 }],
	[[3, 3, 3, 1, 2], { min: 1, max: 3, range: 2, mean: 2.4, mode: 3, sum: 12 }],
	[[0, 0, 0], { min: 0, max: 0, range: 0, mean: 0, mode: 0, sum: 0 }],
	[[10, 20, 30, 40], { min: 10, max: 40, range: 30, mean: 25, mode: 25, sum: 100 }],
]

test.each(samples)('summarizes %j like 9.x', (values, expected) => {
	const { total, median, ...actual } = summarize_numbers(count(values))

	expect(actual).toEqual(expected)
	expect(total).toBe(values.length)
	expect(median).toBeTypeOf('number')
})

test('median handles odd and even amounts', () => {
	expect(summarize_numbers(count([1, 5, 3])).median).toBe(3)
	expect(summarize_numbers(count([1, 2, 3, 10])).median).toBe(2.5)
})

test('an empty count summarizes to zeros', () => {
	expect(summarize_numbers(count([]))).toEqual({
		total: 0,
		min: 0,
		max: 0,
		range: 0,
		sum: 0,
		mean: 0,
		mode: 0,
		median: 0,
	})
})

test('summarize_frequencies takes plain frequency maps', () => {
	expect(
		summarize_frequencies(
			new Map([
				[1, 2],
				[3, 2],
			]),
		).mode,
	).toBe(2)
})
