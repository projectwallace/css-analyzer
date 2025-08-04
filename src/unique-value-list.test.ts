import { test, expect, describe } from 'vitest'
import { UniqueValueList } from './unique-value-list.js'

test('empty unique value list', () => {
	let list = new UniqueValueList()
	expect(list.total).toBe(0)
	expect(list.total_unique).toBe(0)
	expect(list.uniqueness_ratio).toBe(0)
	expect(list.max).toEqual(undefined)
})

test('adding unique strings', () => {
	let list = new UniqueValueList<string>()
	list.add('selector1', 0)
		.add('selector2', 1)
		.add('selector1', 2) // duplicate
	expect(list.total).toBe(3)
	expect(list.total_unique).toBe(2)
	expect(list.uniqueness_ratio).toBe(2 / 3)
	expect(list.max).toEqual({
		value: 'selector1',
		count: 2
	})
	expect(list.uniqueness_ratio).toBe(2 / 3)
	expect(list.mode).toBe('selector1')
})

test('adding unique numbers', () => {
	let list = new UniqueValueList<number>()
	list.add(2, 0)
		.add(0, 1)
		.add(0, 2) // duplicate
	expect(list.total).toBe(3)
	expect(list.total_unique).toBe(2)
	expect(list.uniqueness_ratio).toBe(2 / 3)
	expect(list.max).toEqual({
		value: 0,
		count: 2
	})
	expect(list.mode).toEqual(0)
})

test('iterating over unique strings', () => {
	let list = new UniqueValueList<string>()
	list.add('selector1', 0)
		.add('selector2', 1)
		.add('selector1', 2) // duplicate

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
	let list = new UniqueValueList<number>()
	list.add(1, 0)
		.add(2, 1)
		.add(1, 2) // duplicate

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

test('desc', () => {
	let list = new UniqueValueList<number>()
	list.add(1, 0)
		.add(2, 1)
		.add(2, 2) // duplicate

	let desc = list.desc(1)
	let result = Array.from(desc)
	expect(result.length).toBe(1)
	expect(result[0].value).toBe(2)
	expect(result[0].count).toBe(2)
	expect(Array.from(result[0].location_indexes)).toEqual([1, 2])
})

describe('numerics', () => {
	test('empty list', () => {
		let list = new UniqueValueList<number>()
		let numerics = list.numerics
		expect(numerics.sum).toBe(0)
		expect(numerics.max).toBeUndefined()
		expect(numerics.min).toBeUndefined()
		expect(numerics.average).toBe(0)
	})

	test('with numbers', () => {
		let list = new UniqueValueList<number>()
		list.add(1, 0)
			.add(2, 1)
			.add(3, 2)

		let numerics = list.numerics
		expect(numerics.sum).toBe(6)
		expect(numerics.max).toBe(3)
		expect(numerics.min).toBe(1)
		expect(numerics.average).toBe(2)
	})

	test('sums correctly', () => {
		let list = new UniqueValueList<number>()
		list
			.add(1, 0)
			.add(2, 1)
			.add(2, 2)

		let numerics = list.numerics
		expect(numerics.sum).toBe(5) // 1 + 2 + 2
	})
})
