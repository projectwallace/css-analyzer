import { test, expect } from 'vitest'
import { create_counter, create_context_counter, summarize } from './counter.js'

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
