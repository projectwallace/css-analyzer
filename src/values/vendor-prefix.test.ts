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

test.each([
	['-moz-1px', ['-moz-1px']],
	['-webkit-10px', ['-webkit-10px']],
	['1px -webkit-', ['-webkit-']],
	['-webkit-calc(1px)', ['-webkit-calc']],
	['-moz-element(#x)', ['-moz-element']],
])(
	'the parser reads prefixed number-like words as identifiers, so they are found by name: "%s"',
	(value, expected) => {
		expect(get_prefixed_values(value)).toEqual(expected)
	},
)

test.each(['"-webkit-x"', '#-webkit-x'])(
	'ignores prefixes inside strings and hashes: %s',
	(value) => {
		expect(get_prefixed_values(value)).toEqual([])
	},
)
