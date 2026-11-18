import { test, expect } from 'vitest'
import { parse_value } from '@projectwallace/css-parser/parse-value'
import { get_var_references } from './var-references.ts'

test.each([
	['var(--a)', ['--a']],
	['var(--a, var(--b))', ['--a', '--b']],
	['calc(var(--a) * 2) var(--b)', ['--a', '--b']],
	['var(--a, red)', ['--a']],
	['VAR(--a)', ['--a']],
	['var(not-custom)', []],
	['red', []],
])('get_var_references(%j) is %j', (value, expected) => {
	expect(get_var_references(value).map((match) => match.value)).toEqual(expected)
	expect(get_var_references(parse_value(value)).map((match) => match.value)).toEqual(expected)
})

test('points at the name', () => {
	const value = '1px var(--a)'
	const [match] = get_var_references(value)
	expect(value.slice(match!.offset, match!.offset + match!.length)).toBe('--a')
})
