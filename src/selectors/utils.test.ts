import { test, expect } from 'vitest'
import { parse_selector_list } from '@projectwallace/css-parser/parse-selector'
import {
	get_complexity,
	get_vendor_prefixes,
	get_accessibility_selectors,
	get_combinators,
	get_pseudo_elements_in_is_where,
} from './index.ts'
import { get_specificity } from './specificity.ts'

function texts(matches: { value: string }[]): string[] {
	return matches.map((match) => match.value)
}

const selector = 'a.b > #c:not(.d)::-webkit-scrollbar [aria-hidden="true"]'

test('every util accepts text and nodes with identical output', () => {
	const node = parse_selector_list(selector)
	expect(get_specificity(node)).toEqual(get_specificity(selector))
	expect(get_complexity(node)).toEqual(get_complexity(selector))
	expect(get_vendor_prefixes(node)).toEqual(get_vendor_prefixes(selector))
	expect(get_accessibility_selectors(node)).toEqual(get_accessibility_selectors(selector))
	expect(get_combinators(node)).toEqual(get_combinators(selector))
})

test('get_complexity returns the complexity (as value) and location of every selector', () => {
	expect(get_complexity('a, a.b')).toEqual([
		{ value: 1, line: 1, column: 1, offset: 0, length: 1 },
		{ value: 2, line: 1, column: 4, offset: 3, length: 3 },
	])
})

test('get_vendor_prefixes returns the prefixed names with their colons', () => {
	expect(texts(get_vendor_prefixes('a::-webkit-scrollbar, :-moz-focusring'))).toEqual([
		'::-webkit-scrollbar',
		':-moz-focusring',
	])
})

test('get_accessibility_selectors returns normalized attribute selectors', () => {
	expect(texts(get_accessibility_selectors('[ROLE=button], [aria-hidden=true], [data-x]'))).toEqual(
		['[role="button"]', '[aria-hidden="true"]'],
	)
})

test('get_combinators returns names and locations as data', () => {
	expect(get_combinators('a > b c')).toEqual([
		{ value: '>', offset: 2, line: 1, column: 3, length: 1 },
		{ value: ' ', offset: 5, line: 1, column: 6, length: 1 },
	])
})

// Only offsets are checked: the parser's columns are off after a descendant combinator
test('get_vendor_prefixes and get_accessibility_selectors locate the selector part', () => {
	expect(get_vendor_prefixes('a ::-ms-clear')).toMatchObject([
		{ value: '::-ms-clear', offset: 2, length: 11 },
	])
	expect(get_accessibility_selectors('a [ROLE=tab]')).toMatchObject([
		{ value: '[role="tab"]', offset: 2, length: 10 },
	])
})

test.each<[string, number]>([
	['*', 1],
	['* + *', 3],
	['a', 1],
	['a b', 3],
	['a + b', 3],
	['a ~ b', 3],
	['#id', 1],
	['.className', 1],
	['[attr]', 1],
	['[attr=value]', 2],
	[':where(#id, .class)', 3],
	[':WHERE(#id, .class)', 3],
	['main > :IS(h1, h2)', 5],
	['main > :is(h1, h2)', 5],
	['input[type=text]::-webkit-input-placeholder', 5],
	['::-webkit-scrollbar', 2],
	[':-moz-any(header, footer)', 4],
	['.site-header .main-nav:hover>ul>li:nth-child(1) svg', 12],
	['no-prefix', 1],
	['fake-webkit', 1],
	['.-mt-px', 1],
])('complexity of "%s" is %i', (selector, expected) => {
	expect(get_complexity(selector).map((match) => match.value)).toEqual([expected])
})

test('complexity of a deeply nested :where() adds up its parts', () => {
	const ids = Array.from({ length: 26 }, (_, i) => `#${String.fromCharCode(97 + i)}`).join(' ')
	expect(get_complexity(`:where(${ids})`)[0]!.value).toBe(52)
})

test('prefixes of pseudo-classes, pseudo-elements and type selectors', () => {
	expect(texts(get_vendor_prefixes(':-moz-any(a), ::-ms-clear, no-prefix, fake-webkit'))).toEqual([
		':-moz-any',
		'::-ms-clear',
	])
})

test('accessibility selectors are normalized and found inside pseudo-classes', () => {
	expect(
		texts(
			get_accessibility_selectors(
				'[aria-hidden], [ARIA-HIDDEN], [ROLE=tablist], .a:not([role="menu"]), [data-x]',
			),
		),
	).toEqual(['[aria-hidden]', '[aria-hidden]', '[role="tablist"]', '[role="menu"]'])
})

test.each([
	[':is(a::before)', ['::before']],
	[':where(a, b::after)', ['::after']],
	[':IS(a::before, b::after)', ['::before', '::after']],
	[':is(:not(a::before))', ['::before']],
	['a::before', []],
	[':not(a::before)', []],
	[':is(a)', []],
])('get_pseudo_elements_in_is_where(%j) is %j', (selector, expected) => {
	expect(get_pseudo_elements_in_is_where(selector).map((match) => match.value)).toEqual(expected)
})

test('get_pseudo_elements_in_is_where says which pseudo-class it is in', () => {
	const [match] = get_pseudo_elements_in_is_where('a:where(b::after)')
	expect(match).toMatchObject({ pseudo_class: 'where', offset: 9, length: 7 })
})
