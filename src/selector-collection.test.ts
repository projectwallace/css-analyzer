import { test, expect } from 'vitest'
import { SelectorCollection } from './selector-collection.js'

test('empty selector collection', () => {
	let collection = new SelectorCollection()
	expect(collection.total).toBe(0)
	expect(collection.total_unique).toBe(0)
	expect(collection.prefixes.total).toBe(0)
	expect(collection.uniqueness_ratio).toBe(0)
})

test('adding selectors', () => {
	let collection = new SelectorCollection()
	collection.add(1, 1, 0, 1, 1, false, false, 0, 0, 1, () => 'a', 0, 123, undefined, undefined)
	collection.add(1, 3, 2, 3, 1, false, false, 0, 0, 1, () => 'b', 0, 234, undefined, undefined)
	collection.add(1, 5, 4, 5, 1, false, false, 0, 0, 1, () => 'b', 0, 234, undefined, undefined) // duplicate
	expect(collection.total).toBe(3)
	expect(collection.total_unique).toBe(2)
	expect(collection.uniqueness_ratio).toBe(2 / 3)
})
