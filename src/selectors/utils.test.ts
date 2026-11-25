import { test, expect } from 'vitest'
import { parse_selector } from '@projectwallace/css-parser/parse-selector'
import { get_vendor_prefixes, get_accessibility_selectors, get_combinators } from './index.ts'

function names(matches: { name: string }[]): string[] {
	return matches.map((match) => match.name)
}

function selectors(matches: { selector: string }[]): string[] {
	return matches.map((match) => match.selector)
}

test('get_vendor_prefixes returns the prefixed names with their colons', () => {
	expect(names(get_vendor_prefixes(parse_selector('a::-webkit-scrollbar:-moz-focusring')))).toEqual(
		['::-webkit-scrollbar', ':-moz-focusring'],
	)
})

test('get_accessibility_selectors returns normalized attribute selectors', () => {
	expect(
		selectors(
			get_accessibility_selectors(parse_selector('[ROLE=button][aria-hidden=true][data-x]')),
		),
	).toEqual(['[role="button"]', '[aria-hidden="true"]'])
})

test('get_combinators returns names and locations as data', () => {
	expect(get_combinators(parse_selector('a > b c'))).toEqual([
		{ value: '>', name: '>', start_offset: 2, end_offset: 3, line: 1, column: 3 },
		{ value: ' ', name: ' ', start_offset: 5, end_offset: 6, line: 1, column: 6 },
	])
})

// Only offsets are checked: the parser's columns are off after a descendant combinator
test('get_vendor_prefixes and get_accessibility_selectors locate the selector part', () => {
	expect(get_vendor_prefixes(parse_selector('a ::-ms-clear'))).toMatchObject([
		{ value: '::-ms-clear', name: '::-ms-clear', start_offset: 2, end_offset: 13 },
	])
	expect(get_accessibility_selectors(parse_selector('a [ROLE=tab]'))).toMatchObject([
		{ value: '[ROLE=tab]', selector: '[role="tab"]', start_offset: 2, end_offset: 12 },
	])
})

test('prefixes of pseudo-classes, pseudo-elements and type selectors', () => {
	expect(
		names(get_vendor_prefixes(parse_selector(':-moz-any(a)::-ms-clear no-prefix fake-webkit'))),
	).toEqual([':-moz-any', '::-ms-clear'])
})

test('accessibility selectors are normalized and found inside pseudo-classes', () => {
	expect(
		selectors(
			get_accessibility_selectors(
				parse_selector('[aria-hidden][ARIA-HIDDEN][ROLE=tablist].a:not([role="menu"])[data-x]'),
			),
		),
	).toEqual(['[aria-hidden]', '[aria-hidden]', '[role="tablist"]', '[role="menu"]'])
})
