import { test, expect } from 'vitest'
import { AggregateCollection } from './aggregate-collection.js'

test('aggregates correctly', () => {
	const fixture = new AggregateCollection()
	fixture.push(1)
	fixture.push(2)
	fixture.push(25)
	fixture.push(3)
	fixture.push(4)
	fixture.push(4)
	const actual = fixture.aggregate()
	const expected = {
		max: 25,
		min: 1,
		range: 24,
		mean: 39 / 6,
		mode: 4,
		sum: 39,
	}

	expect(actual).toEqual(expected)
	expect(fixture.toArray()).toEqual([1, 2, 25, 3, 4, 4])
})

test('handles collections without values', () => {
	const fixture = new AggregateCollection()
	const aggregate = fixture.aggregate()
	const items = fixture.toArray()

	expect(aggregate).toEqual({
		max: 0,
		min: 0,
		range: 0,
		mean: 0,
		mode: 0,
		sum: 0,
	})
	expect(items).toEqual([])
})
