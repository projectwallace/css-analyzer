import { expect, test } from 'vitest'
import { Collection } from './collection.js'

test('simple count', () => {
	const collection = new Collection()
	const loc = { start: { offset: 1, line: 1, column: 1 }, end: { offset: 2, line: 1, column: 2 } }
	collection.add('one', loc)
	collection.add('one', loc)
	collection.add('two', loc)
	collection.add('two', loc)
	collection.add('three', loc)

	const result = Array.from(collection.list())
	expect(result).toEqual([
		{ name: 'one', count: 2 },
		{ name: 'two', count: 2 },
		{ name: 'three', count: 1 }
	])
})

test('counts "0" as a string', () => {
	const collection = new Collection()
	const loc = { start: { offset: 1, line: 1, column: 1 }, end: { offset: 2, line: 1, column: 2 } }
	collection.add('0', loc)

	const result = Array.from(collection.list())
	expect(result).toEqual([
		{ name: '0', count: 1 }
	])
	expect(collection.total).toBe(1)
	expect(collection.has('0')).toBeTruthy()
})

test('empty list', () => {
	const collection = new Collection()
	const result = Array.from(collection.list())
	expect(result).toEqual([])
})

test('unique', () => {
	const collection = new Collection()
	const loc = { start: { offset: 1, line: 1, column: 1 }, end: { offset: 2, line: 1, column: 2 } }
	collection.add('one', loc)
	collection.add('one', loc)
	collection.add('two', loc)
	collection.add('two', loc)
	collection.add('three', loc)

	expect(collection.total_unique).toBe(3)
})

test('empty unique', () => {
	const collection = new Collection()
	expect(collection.total_unique).toBe(0)
})

test('locations', () => {
	const collection = new Collection()
	collection.add('one', { start: { offset: 1, line: 1, column: 1 }, end: { offset: 2, line: 1, column: 2 } })
	collection.add('one', { start: { offset: 3, line: 2, column: 1 }, end: { offset: 4, line: 2, column: 2 } })

	const result = Array.from(collection.locations('one'))
	expect(result).toEqual([
		{ start: 1, end: 2, line: 1, column: 1 },
		{ start: 3, end: 4, line: 2, column: 1 }
	])
})

test('has', () => {
	const collection = new Collection()
	collection.add('one', { start: { offset: 1, line: 1, column: 1 }, end: { offset: 2, line: 1, column: 2 } })
	expect(collection.has('one')).toBeTruthy()
	expect(collection.has('two')).toBeFalsy()
})

test('JSON.stringify', () => {
	const collection = new Collection()
	collection.add('one', { start: { offset: 1, line: 1, column: 1 }, end: { offset: 2, line: 1, column: 2 } })
	collection.add('one', { start: { offset: 3, line: 2, column: 1 }, end: { offset: 4, line: 2, column: 2 } })
	collection.add('two', { start: { offset: 5, line: 3, column: 1 }, end: { offset: 6, line: 3, column: 2 } })

	const result = JSON.stringify(collection)
	expect(result).toBe('[{"name":"one","count":2,"locations":[{"line":1,"column":1,"start":1,"end":2},{"line":2,"column":1,"start":3,"end":4}]},{"name":"two","count":1,"locations":[{"line":3,"column":1,"start":5,"end":6}]}]')
})

test('toJSON', () => {
	const collection = new Collection()
	collection.add('one', { start: { offset: 1, line: 1, column: 1 }, end: { offset: 2, line: 1, column: 2 } })
	collection.add('one', { start: { offset: 3, line: 2, column: 1 }, end: { offset: 4, line: 2, column: 2 } })
	collection.add('two', { start: { offset: 5, line: 3, column: 1 }, end: { offset: 6, line: 3, column: 2 } })

	const result = collection.toJSON()
	expect(result).toEqual([
		{ name: 'one', count: 2, locations: [{ start: 1, end: 2, line: 1, column: 1 }, { start: 3, end: 4, line: 2, column: 1 }] },
		{ name: 'two', count: 1, locations: [{ start: 5, end: 6, line: 3, column: 1 }] }
	])
})

test('total', () => {
	const collection = new Collection()
	collection.add('one', { start: { offset: 1, line: 1, column: 1 }, end: { offset: 2, line: 1, column: 2 } })
	collection.add('one', { start: { offset: 3, line: 2, column: 1 }, end: { offset: 4, line: 2, column: 2 } })
	collection.add('two', { start: { offset: 5, line: 3, column: 1 }, end: { offset: 6, line: 3, column: 2 } })

	expect(collection.total).toBe(3)
})

test('empty total', () => {
	const collection = new Collection()
	expect(collection.total).toBe(0)
})

test('unique ratio', () => {
	const collection = new Collection()
	collection.add('one', { start: { offset: 1, line: 1, column: 1 }, end: { offset: 2, line: 1, column: 2 } })
	collection.add('one', { start: { offset: 3, line: 2, column: 1 }, end: { offset: 4, line: 2, column: 2 } })
	collection.add('two', { start: { offset: 5, line: 3, column: 1 }, end: { offset: 6, line: 3, column: 2 } })

	expect(collection.uniqueness_ratio).toBe(2 / 3)
})

test('empty unique ratio', () => {
	const collection = new Collection()
	expect(collection.uniqueness_ratio).toBe(0)
})

