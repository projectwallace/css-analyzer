import { test, expect, describe } from 'vitest'
import { LocationList } from './location-list.js'

test('LocationList basic functionality', () => {
	const list = new LocationList(10)
	expect(list.length).toBe(0)

	const index1 = list.add(1, 2, 3, 5)
	expect(index1).toBe(0)
	expect(list.length).toBe(1)
	expect(list.at(index1)).toEqual({ line: 1, column: 2, start: 3, end: 5 })

	const index2 = list.add(2, 3, 6, 8)
	expect(index2).toBe(1)
	expect(list.length).toBe(2)
	expect(list.at(index2)).toEqual({ line: 2, column: 3, start: 6, end: 8 })
})

test('empty LocationList', () => {
	const list = new LocationList(0)
	expect(list.length).toBe(0)

	expect(list.at(0)).toBeUndefined()
})
