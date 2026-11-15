import { test, expect } from 'vitest'
import { parse_value } from '@projectwallace/css-parser/parse-value'
import {
	extract_border_radiuses,
	extract_box_shadows,
	extract_text_shadows,
	extract_z_indexes,
} from './index.ts'

function values(matches: { value: string }[]): string[] {
	return matches.map((match) => match.value)
}

test.each([
	['z-index', '10', ['10']],
	['Z-INDEX', 'var(--layer)', ['var(--layer)']],
	['z-index', '-1', ['-1']],
	['z-index', 'auto', []],
	['z-index', '5\\9', ['5']],
	['position', '10', []],
])('extract_z_indexes("%s", "%s") is %j', (property, value, expected) => {
	expect(values(extract_z_indexes(property, value))).toEqual(expected)
})

test.each([
	['box-shadow', '0 0 1px red, 0 0 2px blue', ['0 0 1px red, 0 0 2px blue']],
	['-webkit-box-shadow', '0 0 1px red', ['0 0 1px red']],
	['box-shadow', 'none', []],
	['text-shadow', '0 0 1px red', []],
])('extract_box_shadows("%s", "%s") is %j', (property, value, expected) => {
	expect(values(extract_box_shadows(property, value))).toEqual(expected)
})

test.each([
	['text-shadow', '1px 1px 2px black', ['1px 1px 2px black']],
	['text-shadow', 'none', []],
	['box-shadow', '1px 1px 2px black', []],
])('extract_text_shadows("%s", "%s") is %j', (property, value, expected) => {
	expect(values(extract_text_shadows(property, value))).toEqual(expected)
})

test.each([
	['border-radius', '4px 2px / 1px', ['4px 2px / 1px']],
	['BORDER-TOP-LEFT-RADIUS', '4px', ['4px']],
	['-webkit-border-radius', '4px', ['4px']],
	['border-start-end-radius', '1em 2em', ['1em 2em']],
	['border-radius', 'inherit', []],
	['border', '1px solid', []],
])('extract_border_radiuses("%s", "%s") is %j', (property, value, expected) => {
	expect(values(extract_border_radiuses(property, value))).toEqual(expected)
})

test('accept a parsed value, and point at the whole value', () => {
	expect(extract_z_indexes('z-index', parse_value('10'))).toEqual(
		extract_z_indexes('z-index', '10'),
	)
	expect(extract_box_shadows('box-shadow', '0 0 red')).toEqual([
		{ value: '0 0 red', line: 1, column: 1, offset: 0, length: 7 },
	])
})
