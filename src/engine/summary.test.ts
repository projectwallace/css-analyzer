import { test, expect } from 'vitest'
import { AggregateCollection } from '../aggregate-collection.js'
import { create_counter, merge_counts } from './counter.js'
import { summarize_frequencies, summarize_numbers } from './summary.js'

const at = { loc: { line: 1, column: 1, offset: 0, length: 1 } }

function count(values: number[]) {
	const counter = create_counter()
	for (const value of values) counter.add(String(value), at)
	return counter.result()
}

const samples = [
	[1, 2, 25, 3, 4, 4],
	[5],
	[1, 1, 2, 2],
	[3, 3, 3, 1, 2],
	[0, 0, 0],
	[10, 20, 30, 40],
]

test.each(samples)('matches the 9.x aggregate for %j', (...values) => {
	const aggregate = new AggregateCollection()
	for (const value of values) aggregate.push(value)
	const expected = aggregate.aggregate()
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

test('summarizing merged counts equals summarizing all values', () => {
	const a = [1, 2, 2, 9]
	const b = [2, 3, 3, 3]
	expect(summarize_numbers(merge_counts(count(a), count(b)))).toEqual(
		summarize_numbers(count([...a, ...b])),
	)
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
