import { test, expect } from 'vitest'
import { parse_selector } from '@projectwallace/css-parser/parse-selector'
import { get_complexity } from './index.ts'

test('get_complexity returns the complexity of one selector', () => {
	expect(get_complexity(parse_selector('a'))).toBe(1)
	expect(get_complexity(parse_selector('a.b'))).toBe(2)
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
