import { test, expect } from 'vitest'
import { as_prelude, as_selectors, as_value } from './input.js'

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
	expect(() => as_selectors(as_value('1px'))).toThrow(TypeError)
})

test('as_prelude parses text as the prelude of the named at-rule and passes nodes through', () => {
	const [prelude] = as_prelude('media', '(min-width: 1px)')
	expect(prelude).toBeDefined()
	expect(as_prelude('media', prelude!)).toEqual([prelude])
})
