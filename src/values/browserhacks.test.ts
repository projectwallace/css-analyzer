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
	['expression(a) alpha(opacity=50)', ['expression()', 'alpha()']],
])('finds the hacks in "%s"', (value, expected) => {
	expect(get_value_browserhacks(value)).toEqual(expected)
})

test.each(['red', '1px solid red', 'url(image.png)', 'calc(1px + 2px)', 'rgb(0 0 0 / 50%)'])(
	'finds no hacks in "%s"',
	(value) => {
		expect(get_value_browserhacks(value)).toEqual([])
	},
)
