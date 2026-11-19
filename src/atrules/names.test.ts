import { test, expect } from 'vitest'
import { get_keyframes_name, get_layer_names } from './index.ts'
import { parse_prelude } from '../test/test-utils.ts'

test.each([
	['fade', 'fade'],
	['"my fade"', 'my fade'],
	['--my-name', '--my-name'],
])('get_keyframes_name("%s") is "%s"', (prelude, expected) => {
	expect(get_keyframes_name(parse_prelude('keyframes', prelude))?.name).toBe(expected)
})

test('get_keyframes_name points at the name, quotes included', () => {
	const css = '@keyframes "my fade" {}'
	const match = get_keyframes_name(parse_prelude('keyframes', '"my fade"'))
	// The parser's column inside an at-rule prelude is not reliable: only offsets are checked
	expect(match).toMatchObject({
		value: '"my fade"',
		name: 'my fade',
		line: 1,
		start_offset: 11,
		end_offset: 20,
	})
	expect(css.slice(match!.start_offset, match!.end_offset)).toBe('"my fade"')
})

test.each([
	['a', ['a']],
	['a, b.c ,d', ['a', 'b.c', 'd']],
])('get_layer_names("%s") is %j', (prelude, expected) => {
	expect(get_layer_names(parse_prelude('layer', prelude)).map((match) => match.value)).toEqual(
		expected,
	)
})

test('get_layer_names points at every name', () => {
	const css = '@layer base, components.buttons {}'
	const names = get_layer_names(parse_prelude('layer', 'base, components.buttons'))
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
