import { test, expect } from 'vitest'
import { parse_selector_list } from '@projectwallace/css-parser/parse-selector'
import { get_specificity, compare_specificity } from './specificity.js'

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
	expect(() =>
		get_specificity(parse_selector_list('a').first_child!.first_child! as never),
	).toThrow(TypeError)
})

test('compare_specificity sorts ascending', () => {
	expect(compare_specificity([0, 1, 0], [0, 0, 5])).toBeGreaterThan(0)
	expect(compare_specificity([0, 0, 1], [0, 0, 1])).toBe(0)
	expect(compare_specificity([1, 0, 0], [2, 0, 0])).toBeLessThan(0)
})

// Examples from https://drafts.csswg.org/selectors-4/#specificity-rules and bramus/specificity
test.each<[string, [number, number, number]]>([
	['*', [0, 0, 0]],
	['li', [0, 0, 1]],
	['ul li', [0, 0, 2]],
	['ul ol+li', [0, 0, 3]],
	['h1 + *[rel=up]', [0, 1, 1]],
	['ul ol li.red', [0, 1, 3]],
	['li.red.level', [0, 2, 1]],
	['#x34y', [1, 0, 0]],
	['#s12:not(foo)', [1, 0, 1]],
	['.foo > #bar', [1, 1, 0]],
	['a[href]', [0, 1, 1]],
	['a:hover', [0, 1, 1]],
	['p::before', [0, 0, 2]],
	['::-webkit-scrollbar', [0, 0, 1]],
	[':where(#id, .class)', [0, 0, 0]],
	[':is(#id, .class)', [1, 0, 0]],
	[':not(span, strong#foo)', [1, 0, 1]],
	['a:has(> img.logo)', [0, 1, 2]],
	['li:nth-child(2n + 1)', [0, 1, 1]],
	['li:nth-child(2n + 1 of .odd, #special)', [1, 1, 1]],
	['::part(label)', [0, 0, 1]],
	['::highlight(name)', [0, 0, 1]],
])('specificity of "%s"', (selector, expected) => {
	expect(get_specificity(selector)).toEqual([expected])
})
