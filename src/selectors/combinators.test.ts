import { test, expect } from 'vitest'
import { analyze } from '../index-new.js'
import { Specificity } from '../specificity.js'

test('counts total selectors', () => {
	let result = analyze('a + b {}').selectors
	expect(result.total).toBe(1)
	expect(result.total_unique).toBe(1)
	expect(result.uniqueness_ratio).toBe(1)
})

test('counts prefixed selectors', () => {
	let result = analyze('test, ::-webkit-spin-button, ::-moz-placeholder {}').selectors.prefixes
	expect(result.total).toBe(2)
	expect(result.total_unique).toBe(2)
	expect(result.ratio).toBe(2 / 3)
	expect(result.uniqueness_ratio).toBe(2 / 2)
	expect(Array.from(result.get_unique())).toEqual([
		{
			value: '::-webkit-spin-button',
			locations: [{ line: 1, column: 7, start: 6, end: 27 }],
			count: 1,
		},
		{
			value: '::-moz-placeholder',
			locations: [{ line: 1, column: 30, start: 29, end: 47 }],
			count: 1,
		}
	])
})

test('counts accessibility selectors', () => {
	let result = analyze('test, [aria-hidden="true"], :where([role="region"]) {}').selectors.accessibility
	expect(result.total).toBe(2)
	expect(result.total_unique).toBe(2)
	expect(result.ratio).toBe(2 / 3)
	expect(result.uniqueness_ratio).toBe(2 / 2)
	expect(Array.from(result.get_unique())).toEqual([
		{
			value: '[aria-hidden="true"]',
			locations: [{ line: 1, column: 7, start: 6, end: 26 }],
			count: 1,
		},
		{
			value: ':where([role="region"])',
			locations: [{ line: 1, column: 29, start: 28, end: 51 }],
			count: 1,
		}
	])
	expect(result.get_unique().next().value!.locations).toEqual([{ line: 1, column: 7, start: 6, end: 26 }])
})

test('counts complexities', () => {
	let result = analyze('a, #b, a ~ b {}').selectors.complexity
	expect(Array.from(result.items)).toEqual([1, 1, 3]) // account for Uint32Array
	expect(result.max).toBe(3)
	expect(result.min).toBe(1)
	expect(result.sum).toBe(5)
	expect(result.average).toBe(5 / 3)
	expect(result.total_unique).toBe(2)
	expect(result.uniqueness_ratio).toBe(2 / 3)

	let unique = result.get_unique()
	let first = unique.next().value!
	expect(first.value).toBe(1)
	expect(first.count).toBe(2)

	let second = unique.next().value!
	expect(second.value).toBe(3)
	expect(second.count).toBe(1)
	expect(second.locations).toEqual([
		{
			line: 1,
			column: 8,
			start: 7,
			end: 12
		}
	])

	// There should be no more items
	expect(unique.next().done).toBeTruthy()
})

test('counts depths', () => {
	let result = analyze('a, #b {} c { } @media all { e {} @layer x { f{} } }').selectors.nesting
	expect(Array.from(result.items)).toEqual([0, 0, 0, 1, 2])
	expect(result.max).toBe(2)
	expect(result.min).toBe(0)
	expect(result.sum).toBe(3)
	expect(result.average).toBe(3 / 5)
	expect(result.total_unique).toBe(3)

	let unique = result.unique()
	let first = unique.next().value!
	expect(first.value).toBe(0)
	expect(first.count).toBe(3)

	let second = unique.next().value!
	expect(second.value).toBe(1)
	expect(second.count).toBe(1)
	expect(second.locations).toEqual([
		{
			line: 1,
			column: 29,
			start: 28,
			end: 29
		},
	])
})

test('specificities', () => {
	let result = analyze('a, #b, .c, .d {}').selectors.specificity
	expect(result.max).toEqual(new Specificity(1, 0, 0))
	expect(result.min).toEqual(new Specificity(0, 0, 1))
	expect(result.sum).toEqual(new Specificity(1, 2, 1))
	expect(result.mode).toEqual(new Specificity(0, 1, 0))

	let first = result.get_unique().next().value!
	expect(first.specificity).toEqual(new Specificity(0, 0, 1))
	expect(first.locations).toEqual([
		{
			line: 1,
			column: 1,
			start: 0,
			end: 1
		}
	])

	let unique = Array.from(result.get_unique()).map(x => x.specificity)
	expect(unique).toEqual([
		new Specificity(0, 0, 1),
		new Specificity(1, 0, 0),
		new Specificity(0, 1, 0),
	])
})

test('combinators', () => {
	let result = analyze('a, b > c, d e f {}').selectors.combinators
	expect(result.total).toBe(3)
	expect(result.total_unique).toBe(2)
	expect(result.uniqueness_ratio).toBe(2 / 3)

	let unique = result.get_unique()
	let first = unique.next().value!
	expect(first.value).toBe('>')
	expect(first.count).toBe(1)
	expect(first.locations).toEqual([
		{
			line: 1,
			column: 4,
			start: 3,
			end: 8
		}
	])

	let second = unique.next().value!
	expect(second.value).toBe(' ')
	expect(second.count).toBe(2)
	expect(second.locations).toEqual([
		{
			line: 1,
			column: 11,
			start: 10,
			end: 15
		},
		{
			line: 1,
			column: 11,
			start: 10,
			end: 15
		},
	])

	// There should be no more items
	expect(unique.next().done).toBeTruthy()
})

test('pseudos', () => {
	let result = analyze('a:is(:where(a)), a:hover, b:hover {}').selectors.pseudos
	expect(result.total).toBe(4)
	expect(result.total_unique).toBe(3)
	expect(result.uniqueness_ratio).toBe(3 / 4)

	let unique = result.get_unique()

	let first = unique.next().value!
	expect(first.value).toBe('is')
	expect(first.count).toBe(1)
	expect(first.locations).toEqual([
		{
			line: 1,
			column: 1,
			start: 0,
			end: 15
		}
	])

	let second = unique.next().value!
	expect(second.value).toBe('where')
	expect(second.count).toBe(1)
	expect(second.locations).toEqual([
		{
			line: 1,
			column: 1,
			start: 0,
			end: 15
		}
	])

	let third = unique.next().value!
	expect(third.value).toBe('hover')
	expect(third.count).toBe(2)
	expect(third.locations).toEqual([
		{
			line: 1,
			column: 18,
			start: 17,
			end: 24
		},
		{
			line: 1,
			column: 27,
			start: 26,
			end: 33
		}
	])

	expect(unique.next().done).toBeTruthy()
})

test('to JSON', () => {
	let result = JSON.parse(JSON.stringify(analyze('#a, b .b #b [b] {}').selectors))
	expect(result.total).toBe(2)
	expect(result.total_unique).toBe(2)
	expect(result.specificity.max).toEqual([1, 2, 1])
})
