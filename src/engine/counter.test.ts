import { test, expect } from 'vitest'
import {
	create_counter,
	create_context_counter,
	merge_counts,
	merge_context_counts,
	summarize,
} from './counter.js'

const at = { loc: { line: 1, column: 2, offset: 3, length: 4 } }

test('counts totals and uniques in one shape', () => {
	const counter = create_counter()
	counter.add('a', at)
	counter.add('a', at)
	counter.add('b', at)

	expect(counter.result()).toEqual({
		total: 3,
		total_unique: 2,
		unique: new Map([
			['a', { count: 2 }],
			['b', { count: 1 }],
		]),
	})
})

test('locations are opt-in and do not change the shape', () => {
	const with_locations = create_counter({ locations: true })
	with_locations.add('a', at)
	const result = with_locations.result()
	expect(result.unique.get('a')).toEqual({ count: 1, locations: [at.loc] })

	const without = create_counter()
	without.add('a', {
		get loc(): never {
			throw new Error('loc must not be read')
		},
	})
	expect(without.result().unique.get('a')).toEqual({ count: 1 })
})

test('result() is a stable snapshot', () => {
	const counter = create_counter({ locations: true })
	counter.add('a', at)
	const first = counter.result()
	counter.add('a', at)
	expect(first.unique.get('a')?.count).toBe(1)
	expect(first.unique.get('a')?.locations).toHaveLength(1)
	expect(counter.result().unique.get('a')?.count).toBe(2)
})

test('context counter counts per context', () => {
	const counter = create_context_counter({ contexts: true })
	counter.add('red', 'color', at)
	counter.add('red', 'background-color', at)
	counter.add('blue', 'color', at)
	const result = counter.result()

	expect(result.total).toBe(3)
	expect(result.total_unique).toBe(2)
	expect(result.by_context.get('color')?.total).toBe(2)
	expect(result.by_context.get('background-color')?.unique.get('red')).toEqual({ count: 1 })
})

test('merge_counts sums counts and concatenates locations', () => {
	const a = create_counter({ locations: true })
	a.add('x', at)
	const b = create_counter({ locations: true })
	b.add('x', at)
	b.add('y', at)

	const merged = merge_counts(a.result(), b.result())
	expect(merged.total).toBe(3)
	expect(merged.total_unique).toBe(2)
	expect(merged.unique.get('x')?.count).toBe(2)
	expect(merged.unique.get('x')?.locations).toHaveLength(2)
})

test('merge_counts does not mutate its inputs', () => {
	const a = create_counter()
	a.add('x', at)
	const b = create_counter()
	b.add('x', at)
	const a_result = a.result()
	merge_counts(a_result, b.result())
	expect(a_result.unique.get('x')?.count).toBe(1)
})

test('merge_context_counts merges contexts', () => {
	const a = create_context_counter({ contexts: true })
	a.add('red', 'color', at)
	const b = create_context_counter({ contexts: true })
	b.add('red', 'color', at)
	b.add('red', 'fill', at)

	const merged = merge_context_counts(a.result(), b.result())
	expect(merged.total).toBe(3)
	expect(merged.by_context.get('color')?.total).toBe(2)
	expect(merged.by_context.get('fill')?.total).toBe(1)
})

test('summarize derives the uniqueness ratio', () => {
	const counter = create_counter()
	counter.add('a', at)
	counter.add('a', at)
	expect(summarize(counter.result()).uniqueness_ratio).toBe(0.5)
	expect(summarize(create_counter().result()).uniqueness_ratio).toBe(0)
})

test('context counter only tracks contexts when asked', () => {
	const counter = create_context_counter()
	counter.add('red', 'color', at)
	expect(counter.result().total).toBe(1)
	expect(counter.result().by_context.size).toBe(0)
})
