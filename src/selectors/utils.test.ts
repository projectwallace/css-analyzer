import { test, expect } from 'vitest'
import { parse_selector_list } from '@projectwallace/css-parser/parse-selector'
import {
	get_specificity,
	compare_specificity,
	get_complexity,
	get_vendor_prefixes,
	get_accessibility_selectors,
	get_combinators,
} from './index.js'

const selector = 'a.b > #c:not(.d)::-webkit-scrollbar [aria-hidden="true"]'

test('every util accepts text and nodes with identical output', () => {
	const node = parse_selector_list(selector)
	expect(get_specificity(node)).toEqual(get_specificity(selector))
	expect(get_complexity(node)).toEqual(get_complexity(selector))
	expect(get_vendor_prefixes(node)).toEqual(get_vendor_prefixes(selector))
	expect(get_accessibility_selectors(node)).toEqual(get_accessibility_selectors(selector))
	expect(get_combinators(node)).toEqual(get_combinators(selector))
})

test('get_specificity returns one tuple per selector in the list', () => {
	expect(get_specificity('a, .b, #c')).toEqual([
		[0, 0, 1],
		[0, 1, 0],
		[1, 0, 0],
	])
	expect(get_specificity('')).toEqual([])
})

test('get_specificity accepts a single parsed Selector node', () => {
	const [first] = parse_selector_list('a.b, #c')
	expect(get_specificity(first!)).toEqual([[0, 1, 1]])
})

test('get_specificity throws a TypeError for input that is not a selector', () => {
	expect(() => get_specificity(parse_selector_list('a').first_child!.first_child!)).toThrow(
		TypeError,
	)
})

test('compare_specificity sorts ascending', () => {
	expect(compare_specificity([0, 1, 0], [0, 0, 5])).toBeGreaterThan(0)
	expect(compare_specificity([0, 0, 1], [0, 0, 1])).toBe(0)
	expect(compare_specificity([1, 0, 0], [2, 0, 0])).toBeLessThan(0)
})

test('get_complexity returns one number per selector', () => {
	expect(get_complexity('a, a.b')).toEqual([1, 2])
})

test('get_vendor_prefixes returns plain strings with their colons', () => {
	expect(get_vendor_prefixes('a::-webkit-scrollbar, :-moz-focusring')).toEqual([
		'::-webkit-scrollbar',
		':-moz-focusring',
	])
})

test('get_accessibility_selectors returns normalized attribute selectors', () => {
	expect(get_accessibility_selectors('[ROLE=button], [aria-hidden=true], [data-x]')).toEqual([
		'[role="button"]',
		'[aria-hidden="true"]',
	])
})

test('get_combinators returns names and locations as data', () => {
	expect(get_combinators('a > b c')).toEqual([
		{ name: '>', loc: { offset: 2, line: 1, column: 3, length: 1 } },
		{ name: ' ', loc: { offset: 5, line: 1, column: 6, length: 1 } },
	])
})
