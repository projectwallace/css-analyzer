import { test, expect } from 'vitest'
import { parse_value } from '@projectwallace/css-parser/parse-value'
import { extract_gradients } from './index.ts'

test.each([
	['linear-gradient(red, blue)', ['linear-gradient(red, blue)']],
	['-webkit-linear-gradient(red, blue)', ['-webkit-linear-gradient(red, blue)']],
	['-webkit-gradient(linear, 0 0, 0 100%, from(red))', ['-webkit-gradient(linear, 0 0, 0 100%, from(red))']],
	['url(a.png), radial-gradient(red, blue), conic-gradient(red, blue)', ['radial-gradient(red, blue)', 'conic-gradient(red, blue)']],
	['var(--x, linear-gradient(red, blue))', ['linear-gradient(red, blue)']],
	['repeating-linear-gradient(red, blue 10%)', ['repeating-linear-gradient(red, blue 10%)']],
	['image-set(linear-gradient(red, blue) 1x)', ['linear-gradient(red, blue)']],
	['linear-gradient(red, blue) 1', ['linear-gradient(red, blue)']],
	['url(a.svg)', []],
	['Arial, sans-serif', []],
])('extract_gradients("%s")', (value, expected) => {
	expect(extract_gradients(parse_value(value)).map((match) => match.value)).toEqual(expected)
})

test('points at the gradient', () => {
	const value = 'url(a.png), linear-gradient(red, blue)'
	const [match] = extract_gradients(parse_value(value))
	expect(match).toMatchObject({ line: 1, column: 13, start_offset: 12, end_offset: 38 })
	expect(value.slice(match!.start_offset, match!.end_offset)).toBe(match!.value)
})
