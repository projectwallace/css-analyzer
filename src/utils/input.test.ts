import { test, expect } from 'vitest'
import { parse_selector_list, parse_value } from '@projectwallace/css-parser'
import { as_selectors } from './input.ts'

test('as_selectors takes a selector list node, or a selector node', () => {
	const list = parse_selector_list('a, b.c')
	const selectors = as_selectors(list)
	expect(selectors.map((selector) => selector.text)).toEqual(['a', 'b.c'])
	expect(as_selectors(selectors[0]!)).toEqual([selectors[0]])
})

test('as_selectors rejects nodes that are not selectors', () => {
	expect(() => as_selectors(parse_value('1px') as never)).toThrow(TypeError)
})
