import { test, expect } from 'vitest'
import { parse_value } from '@projectwallace/css-parser/parse-value'
import {
	extract_border_radiuses,
	extract_box_shadows,
	extract_text_shadows,
	extract_z_indexes,
} from './index.ts'

function texts(matches: { text: string }[]): string[] {
	return matches.map((match) => match.text)
}

test.each([
	['10', ['10']],
	['var(--layer)', ['var(--layer)']],
	['-1', ['-1']],
	['auto', []],
	['5\\9', ['5']],
])('extract_z_indexes("%s") is %j', (value, expected) => {
	expect(texts(extract_z_indexes(parse_value(value)))).toEqual(expected)
})

test.each([
	['0 0 1px red, 0 0 2px blue', ['0 0 1px red, 0 0 2px blue']],
	['0 0 1px red', ['0 0 1px red']],
	['none', []],
])('extract_box_shadows("%s") is %j', (value, expected) => {
	expect(texts(extract_box_shadows(parse_value(value)))).toEqual(expected)
})

test.each([
	['1px 1px 2px black', ['1px 1px 2px black']],
	['none', []],
])('extract_text_shadows("%s") is %j', (value, expected) => {
	expect(texts(extract_text_shadows(parse_value(value)))).toEqual(expected)
})

test.each([
	['4px 2px / 1px', ['4px 2px / 1px']],
	['4px', ['4px']],
	['1em 2em', ['1em 2em']],
	['inherit', []],
])('extract_border_radiuses("%s") is %j', (value, expected) => {
	expect(texts(extract_border_radiuses(parse_value(value)))).toEqual(expected)
})

test('point at the whole value, as written', () => {
	expect(extract_box_shadows(parse_value('0 0 red'))).toEqual([
		{ value: '0 0 red', text: '0 0 red', line: 1, column: 1, start_offset: 0, end_offset: 7 },
	])
	// The browserhack is not part of the counted text, but it is part of the value
	expect(extract_z_indexes(parse_value('5\\9'))).toEqual([
		{ value: '5\\9', text: '5', line: 1, column: 1, start_offset: 0, end_offset: 3 },
	])
})
