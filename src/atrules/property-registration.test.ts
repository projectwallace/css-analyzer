import { test, expect } from 'vitest'
import { validate_property_registration } from './property-registration.ts'

const valid = { syntax: '"<length>"', inherits: 'false', 'initial-value': '0px' }

function types(name: string, descriptors: Record<string, string | undefined>) {
	return validate_property_registration(name, descriptors).map((issue) => issue.type)
}

test('a valid registration has no issues', () => {
	expect(types('--x', valid)).toEqual([])
	expect(types('--x', { syntax: '"*"', inherits: 'true' })).toEqual([])
	expect(types('--x', { ...valid, syntax: "'<color>'", 'initial-value': 'red' })).toEqual([])
})

test.each([
	['name without --', 'x', valid, ['invalid_name']],
	['missing syntax', '--x', { inherits: 'true' }, ['missing_descriptor']],
	['missing inherits', '--x', { syntax: '"*"' }, ['missing_descriptor']],
	['bad inherits', '--x', { ...valid, inherits: 'yes' }, ['invalid_inherits']],
	['unquoted syntax', '--x', { ...valid, syntax: '<length>' }, ['invalid_syntax']],
	[
		'no initial value',
		'--x',
		{ syntax: '"<length>"', inherits: 'true' },
		['missing_initial_value'],
	],
	[
		'var() in initial value',
		'--x',
		{ ...valid, 'initial-value': 'var(--y)' },
		['dependent_initial_value'],
	],
	['mismatch', '--x', { ...valid, 'initial-value': '10' }, ['mismatched_initial_value']],
	[
		'mismatch with two values',
		'--x',
		{ ...valid, 'initial-value': '1px 2px' },
		['mismatched_initial_value'],
	],
	['function is not checked', '--x', { ...valid, 'initial-value': 'calc(1px)' }, []],
	[
		'a union is not checked',
		'--x',
		{ ...valid, syntax: '"<length> | auto"', 'initial-value': 'auto' },
		[],
	],
] as const)('%s', (_label, name, descriptors, expected) => {
	expect(types(name, descriptors)).toEqual(expected)
})

test.each([
	['<number>', '1.5', true],
	['<integer>', '1.5', false],
	['<integer>', '2', true],
	['<percentage>', '10%', true],
	['<length>', '0', true],
	['<length-percentage>', '10%', true],
	['<angle>', '45deg', true],
	['<time>', '1s', true],
	['<resolution>', '2dppx', true],
	['<flex>', '1fr', true],
	['<color>', 'red', true],
	['<color>', '10px', false],
])('initial value of %s: %s is valid: %s', (syntax, initial, ok) => {
	const issues = validate_property_registration('--x', {
		syntax: `"${syntax}"`,
		inherits: 'false',
		'initial-value': initial,
	})
	expect(issues.length === 0).toBe(ok)
})
