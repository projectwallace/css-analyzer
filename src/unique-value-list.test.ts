import { test, expect } from 'vitest'
import { UniqueValueList } from './unique-value-list.js'

test('empty unique value list', () => {
	let list = new UniqueValueList()
	expect(list.total).toBe(0)
	expect(list.total_unique).toBe(0)
	expect(list.uniqueness_ratio).toBe(0)
	expect(list.min).toBe(0)
	expect(list.max).toBe(0)
})

test('adding unique strings', () => {
	let list = new UniqueValueList()
	list.add('selector1', 0)
	list.add('selector2', 1)
	list.add('selector1', 2) // duplicate
	expect(list.total).toBe(3)
	expect(list.total_unique).toBe(2)
	expect(list.uniqueness_ratio).toBe(2 / 3)
	expect(list.min).toBe(1)
	expect(list.max).toBe(2)
})

test('adding unique numbers', () => {
	let list = new UniqueValueList()
	list.add(2, 0)
	list.add(0, 1)
	list.add(0, 2) // duplicate
	expect(list.total).toBe(3)
	expect(list.total_unique).toBe(2)
	expect(list.uniqueness_ratio).toBe(2 / 3)
	expect(list.min).toBe(1)
	expect(list.max).toBe(2)
})

test('iterating over unique strings', () => {
	let list = new UniqueValueList()
	list.add('selector1', 0)
	list.add('selector2', 1)
	list.add('selector1', 2) // duplicate

	let unique = list[Symbol.iterator]()
	let first = unique.next().value!
	expect(first.value).toBe('selector1')
	expect(first.count).toBe(2)
	expect(Array.from(first.location_indexes)).toEqual([0, 2])

	let second = unique.next().value!
	expect(second.value).toBe('selector2')
	expect(second.count).toBe(1)
	expect(Array.from(second.location_indexes)).toEqual([1])

	// There should be no more items
	expect(unique.next().done).toBeTruthy()
})

test('iterating over unique numbers', () => {
	let list = new UniqueValueList()
	list.add(1, 0)
	list.add(2, 1)
	list.add(1, 2) // duplicate

	let unique = list[Symbol.iterator]()
	let first = unique.next().value!
	expect(first.value).toBe(1)
	expect(first.count).toBe(2)
	expect(Array.from(first.location_indexes)).toEqual([0, 2])

	let second = unique.next().value!
	expect(second.value).toBe(2)
	expect(second.count).toBe(1)
	expect(Array.from(second.location_indexes)).toEqual([1])

	// There should be no more items
	expect(unique.next().done).toBeTruthy()
})
