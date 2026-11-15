import { test, expect } from 'vitest'
import { get_value_browserhacks } from './browserhacks.ts'

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
	expect(get_value_browserhacks(value).map((match) => match.value)).toEqual(expected)
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
	expect(get_value_browserhacks(value).map((match) => match.value)).toEqual([])
})

test.each([
	['value\\9', '\\9', 5],
	['value\\7', '\\7', 5],
	['a progid:x(1)', 'progid:', 2],
	['b alpha(opacity=50)', 'alpha()', 2],
	['url(hack.htc)', '.htc', 0],
])('locates the hack in "%s"', (input, value, offset) => {
	const [match] = get_value_browserhacks(input)
	expect(match).toMatchObject({ value, offset, line: 1, column: offset + 1 })
})

test('locates a hack on a later line', () => {
	const [match] = get_value_browserhacks('1px\n  progid:x(1)')
	expect(match).toMatchObject({ value: 'progid:', line: 2, column: 3, offset: 6, length: 7 })
})
