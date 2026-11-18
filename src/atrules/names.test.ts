import { test, expect } from 'vitest'
import { type Atrule, parse } from '@projectwallace/css-parser'
import {
	get_import_layer,
	get_keyframes_name,
	get_layer_names,
	get_property_name,
} from './index.ts'

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
	expect(match).toEqual({ value: 'my fade', line: 1, column: 3, offset: 2, length: 9 })
	// The parser's column inside an at-rule prelude is not reliable (it says 1): only offsets are checked
	expect(from_node).toMatchObject({ value: 'my fade', line: 1, offset: 11, length: 9 })
	expect(css.slice(from_node!.offset, from_node!.offset + from_node!.length)).toBe('"my fade"')
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
	expect(names.map((match) => css.slice(match.offset, match.offset + match.length))).toEqual([
		'base',
		'components.buttons',
	])
	expect(names[1]).toMatchObject({ value: 'components.buttons', line: 1, offset: 13, length: 18 })
})

test('get_layer_names reads a prelude that was not parsed', () => {
	const css = '@layer base,\n  theme;'
	const names = get_layer_names(atrule_of(css, false).prelude!)
	expect(names).toMatchObject([
		{ value: 'base', line: 1, offset: 7, length: 4 },
		{ value: 'theme', line: 2, offset: 15, length: 5 },
	])
})

test.each([
	['--my-prop', '--my-prop'],
	['  --my-prop  ', '--my-prop'],
	['not-custom', 'not-custom'],
])('get_property_name("%s") is %j', (prelude, expected) => {
	expect(get_property_name(prelude)?.value).toBe(expected)
	expect(get_property_name(atrule_of(`@property ${prelude} {}`).prelude!)?.value).toBe(expected)
})

test('get_property_name finds nothing in an empty prelude and points at the name', () => {
	expect(get_property_name('  ')).toBeNull()
	const prelude = '  --x'
	const match = get_property_name(prelude)!
	expect(prelude.slice(match.offset, match.offset + match.length)).toBe('--x')
})

test.each([
	['url("a.css") layer(base)', 'base'],
	['url("a.css") layer(base.sub)', 'base.sub'],
	['url("a.css") layer', ''],
	['url("a.css") layer()', ''],
	['url("a.css") layer(base) supports(display: grid)', 'base'],
])('get_import_layer(%j) is %j', (prelude, expected) => {
	expect(get_import_layer(prelude)).toMatchObject({ value: expected })
	expect(get_import_layer(atrule_of(`@import ${prelude};`).prelude!)).toMatchObject({
		value: expected,
	})
})

test('get_import_layer is null without a layer', () => {
	expect(get_import_layer('url("a.css")')).toBeNull()
	expect(get_import_layer(atrule_of('@import url("a.css");').prelude!)).toBeNull()
})
