import { test, expect } from 'vitest'
import { get_value_browserhacks } from './browserhacks.ts'
import { parse_value } from '@projectwallace/css-parser'

test.each([
	['value\\9', ['\\9']],
	['value\\7', ['\\7']],
	['progid:DXImageTransform.Microsoft.gradient(startColorstr=#80000000)', ['progid:']],
	['"progid:DXImageTransform.Microsoft.gradient(a=1)"', ['progid:']],
	['alpha(opacity=50)', ['alpha()']],
	['expression(document.body.clientWidth)', ['expression()']],
	['url(hack.htc)', ['.htc']],
	['url("hack.HTC")', ['.htc']],
	['alpha(opacity=50)\\9', ['\\9', 'alpha()']],
	['expression(a) alpha(opacity=50)', ['expression()']],
])('finds the hacks in "%s"', (value, expected) => {
	expect(get_value_browserhacks(parse_value(value)).map((match) => match.hack)).toEqual(expected)
})

test.each([
	'red',
	'1px solid red',
	'url(image.png)',
	'calc(1px + 2px)',
	'rgb(0 0 0 / 50%)',
	'alpha(from red / 50%)',
	'alpha(from var(--my-color) / 80%)',
	'alpha(from var(--my-color) / calc(alpha * 0.5))',
])('finds no hacks in "%s"', (value) => {
	expect(get_value_browserhacks(parse_value(value))).toEqual([])
})

test.each([
	['value\\9', '\\9', '\\9', 5],
	['value\\7', '\\7', '\\7', 5],
	['a progid:x(1)', 'progid:', 'progid:', 2],
	['b alpha(opacity=50)', 'alpha()', 'alpha(opacity=50)', 2],
	['url(hack.htc)', '.htc', 'url(hack.htc)', 0],
])('locates the hack in "%s"', (input, hack, text, offset) => {
	const [match] = get_value_browserhacks(parse_value(input))
	expect(match).toMatchObject({
		hack,
		value: text,
		start_offset: offset,
		line: 1,
		column: offset + 1,
	})
	// `value` is the source text at the location
	expect(input.slice(match!.start_offset, match!.end_offset)).toBe(match!.value)
})

test('locates a hack on a later line', () => {
	const [match] = get_value_browserhacks(parse_value('1px\n  progid:x(1)'))
	expect(match).toMatchObject({
		value: 'progid:',
		hack: 'progid:',
		line: 2,
		column: 3,
		start_offset: 6,
		end_offset: 13,
	})
})
