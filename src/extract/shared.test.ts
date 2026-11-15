import { test, expect } from 'vitest'
import { parse_value } from '@projectwallace/css-parser/parse-value'
import { get_clean_value_text, get_list_items, lowercase_unless_var } from './shared.ts'

test.each([
	['10px', false, '10px'],
	['10px\\9', false, '10px'],
	['10px\\9', true, '10px\\9'],
	['inherit', false, undefined],
	['none', false, undefined],
	['auto', false, undefined],
])('get_clean_value_text("%s", custom: %s) is %j', (value, is_custom, expected) => {
	expect(get_clean_value_text(parse_value(value), is_custom)).toBe(expected)
})

test('get_clean_value_text has nothing for a missing value', () => {
	expect(get_clean_value_text(undefined, false)).toBeUndefined()
})

test('get_list_items skips the separators', () => {
	expect(get_list_items(parse_value('a, b / c')).map((item) => item.text)).toEqual(['a', 'b', 'c'])
})

test.each([
	['EASE', 'ease'],
	['VAR(--X)', 'VAR(--X)'],
	['var(--x, Red)', 'var(--x, Red)'],
])('lowercase_unless_var("%s") is "%s"', (text, expected) => {
	expect(lowercase_unless_var(text)).toBe(expected)
})
