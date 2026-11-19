import { test, expect } from 'vitest'
import { type Atrule, parse } from '@projectwallace/css-parser'
import { get_keyframes_name, get_layer_names } from './index.ts'

function atrule_of(css: string, parse_atrule_preludes = true) {
	return parse(css, { parse_atrule_preludes }).first_child as Atrule
}

test.each([
	['fade', 'fade'],
	['  fade  ', 'fade'],
	['"my fade"', 'my fade'],
	['--my-name', '--my-name'],
])('get_keyframes_name("%s") is "%s", for text and for a parsed prelude', (prelude, expected) => {
	expect(get_keyframes_name(prelude)?.value).toBe(expected)
	expect(get_keyframes_name(atrule_of(`@keyframes ${prelude} {}`).prelude!)?.value).toBe(expected)
})

test('get_keyframes_name is null for an empty prelude', () => {
	expect(get_keyframes_name('')).toBeNull()
	expect(get_keyframes_name('  ')).toBeNull()
})

test('get_keyframes_name points at the name, quotes included', () => {
	const css = '@keyframes "my fade" {}'
	const [match, from_node] = [
		get_keyframes_name('  "my fade"'),
		get_keyframes_name(atrule_of(css).prelude!),
	]
	expect(match).toEqual({
		value: 'my fade',
		line: 1,
		column: 3,
		start_offset: 2,
		end_offset: 11,
	})
	// The parser's column inside an at-rule prelude is not reliable (it says 1): only offsets are checked
	expect(from_node).toMatchObject({
		value: 'my fade',
		line: 1,
		start_offset: 11,
		end_offset: 20,
	})
	expect(css.slice(from_node!.start_offset, from_node!.end_offset)).toBe('"my fade"')
})

test.each([
	['a', ['a']],
	['a, b.c ,d', ['a', 'b.c', 'd']],
])('get_layer_names("%s") is %j, for text and for a parsed prelude', (prelude, expected) => {
	expect(get_layer_names(prelude).map((match) => match.value)).toEqual(expected)
	const prelude_node = atrule_of(`@layer ${prelude};`).prelude!
	expect(get_layer_names(prelude_node).map((match) => match.value)).toEqual(expected)
})

test('get_layer_names finds nothing in an empty prelude', () => {
	expect(get_layer_names('')).toEqual([])
})

test('get_layer_names points at every name', () => {
	const css = '@layer base, components.buttons;'
	const names = get_layer_names(atrule_of(css).prelude!)
	expect(names.map((match) => css.slice(match.start_offset, match.end_offset))).toEqual([
		'base',
		'components.buttons',
	])
	expect(names[1]).toMatchObject({
		value: 'components.buttons',
		line: 1,
		start_offset: 13,
		end_offset: 31,
	})
})

test('get_layer_names reads a prelude that was not parsed', () => {
	const css = '@layer base,\n  theme;'
	const names = get_layer_names(atrule_of(css, false).prelude!)
	expect(names).toMatchObject([
		{ value: 'base', line: 1, start_offset: 7, end_offset: 11 },
		{ value: 'theme', line: 2, start_offset: 15, end_offset: 20 },
	])
})
