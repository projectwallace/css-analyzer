import { test, expect } from 'vitest'
import { analyze } from './index-new.js'
import { PropertyCollection } from './property-collection.js'

test('empty property collection', () => {
	let collection = new PropertyCollection()
	expect(collection.total).toBe(0)
	expect(collection.total_unique).toBe(0)
	expect(collection.uniqueness_ratio).toBe(0)
})

test('counts total properties', () => {
	let result = analyze('a { color: red; }').properties
	expect(result.total).toBe(1)
	expect(result.total_unique).toBe(1)
	expect(result.uniqueness_ratio).toBe(1)
})

test('counts unique properties', () => {
	let result = analyze(`
		a {
			color: red;
			color: green;
			background: blue;
			font-size: 16px;
		}
	`).properties
	expect(result.total).toBe(4)
	expect(result.total_unique).toBe(3)
	expect(result.uniqueness_ratio).toBe(3 / 4)
	expect(Array.from(result.get_unique()).map(({ locations, ...rest }) => (rest))).toEqual([
		{
			value: 'color',
			count: 2,
			is_custom: false,
			is_shorthand: false,
			is_prefixed: false,
			is_browserhack: false,
			complexity: 1
		},
		{
			value: 'background',
			count: 1,
			is_custom: false,
			is_shorthand: true,
			is_prefixed: false,
			is_browserhack: false,
			complexity: 2
		},
		{
			value: 'font-size',
			count: 1,
			is_custom: false,
			is_shorthand: false,
			is_prefixed: false,
			is_browserhack: false,
			complexity: 1
		}
	])
})

test('allows limiting unique properties', () => {
	let result = analyze(`
		a {
			color: red;
			color: green;
			background: blue;
			font-size: 16px;
		}
	`).properties
	expect(Array.from(result.get_unique(2)).map(({ locations, ...rest }) => (rest))).toEqual([
		{
			value: 'color',
			count: 2,
			is_custom: false,
			is_shorthand: false,
			is_prefixed: false,
			is_browserhack: false,
			complexity: 1
		},
		{
			value: 'background',
			count: 1,
			is_custom: false,
			is_shorthand: true,
			is_prefixed: false,
			is_browserhack: false,
			complexity: 2
		}
	])
})
