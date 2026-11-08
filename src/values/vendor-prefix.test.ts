import { test, expect } from 'vitest'
import { get_prefixed_values } from './vendor-prefix.ts'

test.each([
	['-webkit-box', ['-webkit-box']],
	['-webkit-linear-gradient(red, blue)', ['-webkit-linear-gradient']],
	['-moz-calc(1px + 2px)', ['-moz-calc']],
	['linear-gradient(-webkit-gradient(red), blue)', ['-webkit-gradient']],
	['-webkit-box -moz-box', ['-webkit-box', '-moz-box']],
])('finds the prefixed values in "%s"', (value, expected) => {
	expect(get_prefixed_values(value)).toEqual(expected)
})

test.each(['flex', '1px solid red', '--custom-property', 'calc(-1 * var(--x))'])(
	'finds nothing in "%s"',
	(value) => {
		expect(get_prefixed_values(value)).toEqual([])
	},
)
