import { test, expect } from 'vitest'
import { type Atrule, parse } from '@projectwallace/css-parser'
import { as_prelude, as_selectors, as_value } from './input.ts'

test('as_value parses text and passes nodes through', () => {
	const value = as_value('1px solid red')
	expect(value.text).toBe('1px solid red')
	expect(as_value(value)).toBe(value)
})

test('as_selectors parses a selector list, or takes a selector or selector list node', () => {
	const selectors = as_selectors('a, b.c')
	expect(selectors.map((selector) => selector.text)).toEqual(['a', 'b.c'])
	expect(as_selectors(selectors[0]!)).toEqual([selectors[0]])
})

test('as_selectors rejects nodes that are not selectors', () => {
	expect(() => as_selectors(as_value('1px') as never)).toThrow(TypeError)
})

test('as_prelude parses text as the prelude of the named at-rule and passes nodes through', () => {
	expect(as_prelude('media', '(min-width: 1px)')).not.toHaveLength(0)

	const atrule = parse('@media (min-width: 1px) {}', { parse_atrule_preludes: true })
		.first_child as Atrule
	expect(as_prelude('media', atrule.prelude!)).toEqual([atrule.prelude])
})
