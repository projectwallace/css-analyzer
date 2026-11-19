import { test, expect } from 'vitest'
import { parse_value } from '@projectwallace/css-parser/parse-value'
import {
	extract_font_families,
	extract_font_sizes,
	extract_line_heights,
	font_family_properties,
	font_size_properties,
	line_height_properties,
} from './index.ts'

function values(matches: { text: string }[]): string[] {
	return matches.map((match) => match.text)
}

test.each([
	['font-size', '12px', ['12px']],
	['FONT-SIZE', '1.2EM', ['1.2EM']],
	['font-size', 'var(--size, 2px)', ['var(--size, 2px)']],
	['font-size', 'large', ['large']],
	['font-size', '12px\\9', ['12px']],
	['font-size', 'caption', []],
	['font-size', 'inherit', []],
	['font', '12px/1.5 Arial', ['12px']],
	['font', 'bold 1rem serif', ['1rem']],
	['font', 'caption', []],
	['font', 'inherit', []],
	['font', 'var(--font)', []],
	['font-family', '12px', []],
	['line-height', '1.5', []],
])('extract_font_sizes("%s", "%s") is %j', (property, value, expected) => {
	expect(values(extract_font_sizes(property, parse_value(value)))).toEqual(expected)
})

test.each([
	['line-height', '1.5', ['1.5']],
	['line-height', 'normal', ['normal']],
	['line-height', 'inherit', []],
	['font', '12px/1.5 Arial', ['1.5']],
	['font', '12px Arial', []],
	['font', 'caption', []],
	['font-size', '12px', []],
])('extract_line_heights("%s", "%s") is %j', (property, value, expected) => {
	expect(values(extract_line_heights(property, parse_value(value)))).toEqual(expected)
})

test.each([
	['font-family', 'Arial', ['Arial']],
	['font-family', '"Noto Sans", serif', ['"Noto Sans", serif']],
	['font-family', 'system-ui', ['system-ui']],
	['font-family', 'caption', []],
	['font-family', 'inherit', []],
	['font', '12px "Noto Sans", serif', ['"Noto Sans", serif']],
	['font', 'italic bold 12px/2 Source Code Pro, monospace', ['Source Code Pro, monospace']],
	['font', '12px', []],
	['font', 'caption', []],
	['font-size', '12px', []],
])('extract_font_families("%s", "%s") is %j', (property, value, expected) => {
	expect(values(extract_font_families(property, parse_value(value)))).toEqual(expected)
})

test('accept a parsed value as well as text', () => {
	const value = '12px/1.5 Arial'
	expect(extract_font_sizes('font', parse_value(value))).toEqual(
		extract_font_sizes('font', parse_value(value)),
	)
	expect(extract_line_heights('font', parse_value(value))).toEqual(
		extract_line_heights('font', parse_value(value)),
	)
	expect(extract_font_families('font', parse_value(value))).toEqual(
		extract_font_families('font', parse_value(value)),
	)
})

test('a font shorthand points at the part, other properties at the whole value', () => {
	const value = 'bold 12px/1.5 "My Font", serif'
	const [size] = extract_font_sizes('font', parse_value(value))
	const [height] = extract_line_heights('font', parse_value(value))
	const [family] = extract_font_families('font', parse_value(value))
	expect([size, height, family].map((m) => value.slice(m!.start_offset, m!.end_offset))).toEqual([
		'12px',
		'1.5',
		'"My Font", serif',
	])
	expect(extract_font_sizes('font-size', parse_value('1rem'))).toEqual([
		{ value: '1rem', text: '1rem', line: 1, column: 1, start_offset: 0, end_offset: 4 },
	])
})

test('the property filters know the shorthand', () => {
	for (const filter of [font_size_properties, line_height_properties, font_family_properties]) {
		expect(filter.has('FONT')).toBe(true)
	}
	expect(font_size_properties.has('font-size')).toBe(true)
	expect(line_height_properties.has('line-height')).toBe(true)
	expect(font_family_properties.has('font-family')).toBe(true)
	expect(font_size_properties.has('line-height')).toBe(false)
})
