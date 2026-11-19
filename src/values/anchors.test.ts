import { test, expect } from 'vitest'
import { get_anchor_names } from './index.ts'

test.each([
	['--a', ['--a']],
	['--a, --b', ['--a', '--b']],
	['none', []],
	['auto', []],
	['', []],
])('get_anchor_names("%s") is %j', (value, expected) => {
	expect(get_anchor_names(value).map((match) => match.value)).toEqual(expected)
})

test('points at every name', () => {
	expect(get_anchor_names('--a, --bc')).toEqual([
		{ value: '--a', line: 1, column: 1, start_offset: 0, end_offset: 3 },
		{ value: '--bc', line: 1, column: 6, start_offset: 5, end_offset: 9 },
	])
})
