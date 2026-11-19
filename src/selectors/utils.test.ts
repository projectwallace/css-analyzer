import { test, expect } from 'vitest'
import { parse_selector } from '@projectwallace/css-parser/parse-selector'
import {
	get_complexity,
	get_vendor_prefixes,
	get_accessibility_selectors,
	get_combinators,
} from './index.ts'

function texts(matches: { value: string }[]): string[] {
	return matches.map((match) => match.value)
}

test('get_complexity returns the complexity of one selector', () => {
	expect(get_complexity(parse_selector('a'))).toBe(1)
	expect(get_complexity(parse_selector('a.b'))).toBe(2)
})

test('get_vendor_prefixes returns the prefixed names with their colons', () => {
	expect(texts(get_vendor_prefixes(parse_selector('a::-webkit-scrollbar:-moz-focusring')))).toEqual(
		['::-webkit-scrollbar', ':-moz-focusring'],
	)
})

test('get_accessibility_selectors returns normalized attribute selectors', () => {
	expect(
		texts(get_accessibility_selectors(parse_selector('[ROLE=button][aria-hidden=true][data-x]'))),
	).toEqual(['[role="button"]', '[aria-hidden="true"]'])
})

test('get_combinators returns names and locations as data', () => {
	expect(get_combinators(parse_selector('a > b c'))).toEqual([
		{ value: '>', start_offset: 2, end_offset: 3, line: 1, column: 3 },
		{ value: ' ', start_offset: 5, end_offset: 6, line: 1, column: 6 },
	])
})

// Only offsets are checked: the parser's columns are off after a descendant combinator
test('get_vendor_prefixes and get_accessibility_selectors locate the selector part', () => {
	expect(get_vendor_prefixes(parse_selector('a ::-ms-clear'))).toMatchObject([
		{ value: '::-ms-clear', start_offset: 2, end_offset: 13 },
	])
	expect(get_accessibility_selectors(parse_selector('a [ROLE=tab]'))).toMatchObject([
		{ value: '[role="tab"]', start_offset: 2, end_offset: 12 },
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
	expect(get_complexity(parse_selector(selector))).toBe(expected)
})

test('complexity of a deeply nested :where() adds up its parts', () => {
	const ids = Array.from({ length: 26 }, (_, i) => `#${String.fromCharCode(97 + i)}`).join(' ')
	expect(get_complexity(parse_selector(`:where(${ids})`))).toBe(52)
})

test('prefixes of pseudo-classes, pseudo-elements and type selectors', () => {
	expect(
		texts(get_vendor_prefixes(parse_selector(':-moz-any(a)::-ms-clear no-prefix fake-webkit'))),
	).toEqual([':-moz-any', '::-ms-clear'])
})

test('accessibility selectors are normalized and found inside pseudo-classes', () => {
	expect(
		texts(
			get_accessibility_selectors(
				parse_selector('[aria-hidden][ARIA-HIDDEN][ROLE=tablist].a:not([role="menu"])[data-x]'),
			),
		),
	).toEqual(['[aria-hidden]', '[aria-hidden]', '[role="tablist"]', '[role="menu"]'])
})
