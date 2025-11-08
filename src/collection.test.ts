import { test, expect, expectTypeOf } from 'vitest'
import { Collection, type UniqueWithLocations } from './collection'

let loc = { start: { line: 1, column: 1, offset: 1 }, end: { offset: 2 } }

test('basic collection - size()', () => {
	let collection = new Collection()
	collection.p('a', loc)
	collection.p('a', loc)
	expect(collection.size()).toEqual(2)
})

test('count with useLocations=undefined', () => {
	let collection = new Collection()
	collection.p('a', loc)
	collection.p('a', loc)

	let count = collection.c()
	expect(count).toEqual({
		total: 2,
		totalUnique: 1,
		unique: {
			a: 2,
		},
		uniquenessRatio: 0.5,
	})
	expectTypeOf(count['uniqueWithLocations']).toBeUndefined()
})

test('count with useLocations=false', () => {
	let collection = new Collection(false)
	collection.p('a', loc)
	collection.p('a', loc)

	let count = collection.c()
	expect(count).toEqual({
		total: 2,
		totalUnique: 1,
		unique: {
			a: 2,
		},
		uniquenessRatio: 0.5,
	})
	expectTypeOf(count['uniqueWithLocations']).toBeUndefined()
})

test('count with useLocations=true', () => {
	let collection = new Collection(true)
	collection.p('a', loc)
	collection.p('a', loc)

	let pos = { offset: 1, length: 1, line: 1, column: 1 }
	let count = collection.c()
	expect(count).toEqual({
		total: 2,
		totalUnique: 1,
		unique: {},
		uniquenessRatio: 0.5,
		uniqueWithLocations: { a: [pos, pos] },
	})
	expectTypeOf(count['uniqueWithLocations']).toMatchObjectType<UniqueWithLocations>()
})
