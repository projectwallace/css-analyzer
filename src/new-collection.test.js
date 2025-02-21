import { test } from "uvu"
import * as assert from "uvu/assert"
import { Collection } from './new-collection.js'

test('simple count', () => {
	const collection = new Collection()
	const loc = { start: { offset: 1, line: 1, column: 1 }, end: { offset: 2, line: 1, column: 2 } }
	collection.add('one', loc)
	collection.add('one', loc)
	collection.add('two', loc)
	collection.add('two', loc)
	collection.add('three', loc)

	const result = Array.from(collection.list())
	assert.equal(result, [
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
	assert.equal(result, [
		{ name: '0', count: 1 }
	])
	assert.equal(collection.total, 1)
	assert.ok(collection.has('0'))
})

test('empty list', () => {
	const collection = new Collection()
	const result = Array.from(collection.list())
	assert.equal(result, [])
})

test('unique', () => {
	const collection = new Collection()
	const loc = { start: { offset: 1, line: 1, column: 1 }, end: { offset: 2, line: 1, column: 2 } }
	collection.add('one', loc)
	collection.add('one', loc)
	collection.add('two', loc)
	collection.add('two', loc)
	collection.add('three', loc)

	assert.is(collection.total_unique, 3)
})

test('empty unique', () => {
	const collection = new Collection()
	assert.is(collection.total_unique, 0)
})

test('locations', () => {
	const collection = new Collection()
	collection.add('one', { start: { offset: 1, line: 1, column: 1 }, end: { offset: 2, line: 1, column: 2 } })
	collection.add('one', { start: { offset: 3, line: 2, column: 1 }, end: { offset: 4, line: 2, column: 2 } })

	const result = Array.from(collection.locations('one'))
	assert.equal(result, [
		{ start: 1, end: 2, line: 1, column: 1 },
		{ start: 3, end: 4, line: 2, column: 1 }
	])
})

test('has', () => {
	const collection = new Collection()
	collection.add('one', { start: { offset: 1, line: 1, column: 1 }, end: { offset: 2, line: 1, column: 2 } })
	assert.ok(collection.has('one'))
	assert.not(collection.has('two'))
})

test('JSON.stringify', () => {
	const collection = new Collection()
	collection.add('one', { start: { offset: 1, line: 1, column: 1 }, end: { offset: 2, line: 1, column: 2 } })
	collection.add('one', { start: { offset: 3, line: 2, column: 1 }, end: { offset: 4, line: 2, column: 2 } })
	collection.add('two', { start: { offset: 5, line: 3, column: 1 }, end: { offset: 6, line: 3, column: 2 } })

	const result = JSON.stringify(collection)
	assert.is(result, '[{"name":"one","count":2,"locations":[{"line":1,"column":1,"start":1,"end":2},{"line":2,"column":1,"start":3,"end":4}]},{"name":"two","count":1,"locations":[{"line":3,"column":1,"start":5,"end":6}]}]')
})

test('toJSON', () => {
	const collection = new Collection()
	collection.add('one', { start: { offset: 1, line: 1, column: 1 }, end: { offset: 2, line: 1, column: 2 } })
	collection.add('one', { start: { offset: 3, line: 2, column: 1 }, end: { offset: 4, line: 2, column: 2 } })
	collection.add('two', { start: { offset: 5, line: 3, column: 1 }, end: { offset: 6, line: 3, column: 2 } })

	const result = collection.toJSON()
	assert.equal(result, [
		{ name: 'one', count: 2, locations: [{ start: 1, end: 2, line: 1, column: 1 }, { start: 3, end: 4, line: 2, column: 1 }] },
		{ name: 'two', count: 1, locations: [{ start: 5, end: 6, line: 3, column: 1 }] }
	])
})

test('total', () => {
	const collection = new Collection()
	collection.add('one', { start: { offset: 1, line: 1, column: 1 }, end: { offset: 2, line: 1, column: 2 } })
	collection.add('one', { start: { offset: 3, line: 2, column: 1 }, end: { offset: 4, line: 2, column: 2 } })
	collection.add('two', { start: { offset: 5, line: 3, column: 1 }, end: { offset: 6, line: 3, column: 2 } })

	assert.is(collection.total, 3)
})

test('empty total', () => {
	const collection = new Collection()
	assert.is(collection.total, 0)
})

test('unique ratio', () => {
	const collection = new Collection()
	collection.add('one', { start: { offset: 1, line: 1, column: 1 }, end: { offset: 2, line: 1, column: 2 } })
	collection.add('one', { start: { offset: 3, line: 2, column: 1 }, end: { offset: 4, line: 2, column: 2 } })
	collection.add('two', { start: { offset: 5, line: 3, column: 1 }, end: { offset: 6, line: 3, column: 2 } })

	assert.is(collection.uniqueness_ratio, 2 / 3)
})

test('empty unique ratio', () => {
	const collection = new Collection()
	assert.is(collection.uniqueness_ratio, 0)
})

test.run()
