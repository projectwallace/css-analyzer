import { test, expect } from 'vitest'
import { AutoSizeUintArray } from './auto-size-uintarray.js'

test('AutoGrowUintArray basic functionality', () => {
	const arr = new AutoSizeUintArray(2)
	expect(arr.length).toBe(0)

	arr.push(1)
	expect(arr.length).toBe(1)
	expect(Array.from(arr)).toEqual([1])

	arr.push(2)
	expect(arr.length).toBe(2)
	expect(Array.from(arr)).toEqual([1, 2])

	arr.push(3) // This should trigger a grow
	arr.push(4)
	expect(arr.length).toBe(4)
	expect(Array.from(arr)).toEqual([1, 2, 3, 4])
})

test('map', () => {
	const arr = new AutoSizeUintArray(2)
	arr.push(1)
	arr.push(2)
	arr.push(3)

	const result = arr.map(n => n * 2)
	expect(result).toEqual([2, 4, 6])
})
