import { test, expect } from 'vitest'
import { parse_value } from '@projectwallace/css-parser/parse-value'
import { extract_gradients } from './index.ts'

test.each([
	['background', 'linear-gradient(red, blue)', ['linear-gradient(red, blue)']],
	['background', '-webkit-linear-gradient(red, blue)', ['-webkit-linear-gradient(red, blue)']],
	[
		'background',
		'-webkit-gradient(linear, 0 0, 0 100%, from(red))',
		['-webkit-gradient(linear, 0 0, 0 100%, from(red))'],
	],
	[
		'background',
		'url(a.png), radial-gradient(red, blue), conic-gradient(red, blue)',
		['radial-gradient(red, blue)', 'conic-gradient(red, blue)'],
	],
	['background', 'var(--x, linear-gradient(red, blue))', ['linear-gradient(red, blue)']],
	[
		'BACKGROUND-IMAGE',
		'repeating-linear-gradient(red, blue 10%)',
		['repeating-linear-gradient(red, blue 10%)'],
	],
	['mask', 'url(a.svg)', []],
	['font-family', 'linear-gradient(red, blue)', []],
	['transition', 'linear-gradient(red, blue)', []],
	['animation', 'linear-gradient(red, blue)', []],
	['z-index', 'linear-gradient(red, blue)', []],
])('extract_gradients("%s", "%s")', (property, value, expected) => {
	expect(extract_gradients(property, parse_value(value)).map((match) => match.value)).toEqual(
		expected,
	)
})

test('accepts a parsed value as well as text', () => {
	expect(extract_gradients('background', parse_value('linear-gradient(red, blue)'))).toEqual(
		extract_gradients('background', parse_value('linear-gradient(red, blue)')),
	)
})

test('points at the gradient', () => {
	const value = 'url(a.png), linear-gradient(red, blue)'
	const [match] = extract_gradients('background', parse_value(value))
	expect(match).toMatchObject({ line: 1, column: 13, start_offset: 12, end_offset: 38 })
	expect(value.slice(match!.start_offset, match!.end_offset)).toBe(match!.value)
})
