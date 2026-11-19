import { test, expect } from 'vitest'
import { parse_value } from '@projectwallace/css-parser/parse-value'
import { get_font_families } from './index.ts'

function families(value: string, property?: string): string[] {
	return get_font_families(value, property).map((match) => match.value)
}

test.each([
	['Arial', ['Arial']],
	['Arial, sans-serif', ['Arial', 'sans-serif']],
	['"Noto Sans", serif', ['Noto Sans', 'serif']],
	["'Noto Sans'", ['Noto Sans']],
	['Source Code Pro, Menlo, monospace', ['Source Code Pro', 'Menlo', 'monospace']],
	['var(--font), Arial', ['Arial']],
	['', []],
])('get_font_families("%s") is %j', (value, expected) => {
	expect(families(value)).toEqual(expected)
})

test.each([
	['12px Arial', ['Arial']],
	['bold 12px/1.5 "Noto Sans", Source Code Pro, serif', ['Noto Sans', 'Source Code Pro', 'serif']],
	['italic small-caps 700 1rem serif', ['serif']],
	['12px', []],
	['caption', []],
	['inherit', []],
])('the families of font: %s are %j', (value, expected) => {
	expect(families(value, 'font')).toEqual(expected)
	expect(families(value, 'FONT')).toEqual(expected)
})

test('accepts a parsed node as well as text', () => {
	expect(get_font_families(parse_value('"A", B C'))).toEqual(get_font_families('"A", B C'))
})

test('points at every family, quotes included', () => {
	const value = '12px/1 "Noto Sans",  Source Code  Pro, serif'
	const found = get_font_families(value, 'font')
	expect(found.map((match) => value.slice(match.start_offset, match.end_offset))).toEqual([
		'"Noto Sans"',
		'Source Code  Pro',
		'serif',
	])
	expect(found.map((match) => match.value)).toEqual(['Noto Sans', 'Source Code  Pro', 'serif'])
	expect(found[0]).toMatchObject({
		line: 1,
		column: 8,
		start_offset: 7,
		end_offset: 18,
	})
})

test.each([
	['var(--font, Inter), serif', ['Inter', 'serif']],
	['var(--font, "Open Sans", Arial)', ['Open Sans', 'Arial']],
	['var(--a, var(--b, Inter Tight))', ['Inter Tight']],
	['var(--font)', []],
])('get_font_families("%s", "font-family", { deep: true }) is %j', (value, expected) => {
	expect(get_font_families(value, 'font-family', { deep: true }).map((m) => m.value)).toEqual(
		expected,
	)
})

test('get_font_families leaves function arguments out without deep', () => {
	expect(get_font_families('var(--font, Inter), serif').map((m) => m.value)).toEqual(['serif'])
})
