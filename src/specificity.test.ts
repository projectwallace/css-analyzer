import { test, expect } from 'vitest'
import { Specificity } from './specificity.js'

test('compare specificity', () => {
	expect(new Specificity(1, 0, 0).compare(new Specificity(0, 1, 0))).toBe(-1)
	expect(new Specificity(1, 2, 1).compare(new Specificity(1, 0, 0))).toBe(-2)
	expect(new Specificity(0, 0, 0).compare(new Specificity(1, 0, 0))).toBe(1)
	expect(new Specificity(1, 0, 0).compare(new Specificity(1, 0, 0))).toBe(0)
})

test('to JSON', () => {
	let result = JSON.stringify(new Specificity(1, 2, 3))
	expect(result).toEqual('[1,2,3]')
})

test('add', () => {
	let specificity = new Specificity(1, 2, 3)
	specificity.add(specificity)
	expect(specificity.toJSON()).toEqual([2, 4, 6])
	specificity.add(specificity)
	expect(specificity.toJSON()).toEqual([4, 8, 12])
})
