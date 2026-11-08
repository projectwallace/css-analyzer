import { test, expect, expectTypeOf } from 'vitest'
import { Collection, type UniqueWithLocations } from './collection.ts'

const loc = { line: 1, column: 1, offset: 1, length: 1 }

test('basic collection - size()', () => {
	const collection = new Collection()
	collection.p('a', loc)
	collection.p('a', loc)
	expect(collection.size()).toEqual(2)
})

test('count with useLocations=undefined', () => {
	const collection = new Collection()
	collection.p('a', loc)
	collection.p('a', loc)

	const count = collection.c()
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
	const collection = new Collection(false)
	collection.p('a', loc)
	collection.p('a', loc)

	const count = collection.c()
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
	const collection = new Collection(true)
	collection.p('a', loc)
	collection.p('a', loc)

	const pos = { offset: 1, length: 1, line: 1, column: 1 }
	const count = collection.c()
	expect(count).toEqual({
		total: 2,
		totalUnique: 1,
		unique: {},
		uniquenessRatio: 0.5,
		uniqueWithLocations: { a: [pos, pos] },
	})
	expectTypeOf(count['uniqueWithLocations']).toMatchObjectType<UniqueWithLocations>()
})
