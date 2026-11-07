import { test, expect } from 'vitest'
import { parse_value } from '@projectwallace/css-parser/parse-value'
import {
	destructure_font_shorthand,
	get_prefixed_values,
	get_value_browserhacks,
	is_value_reset,
} from './index.js'

test('is_value_reset accepts text and nodes', () => {
	expect(is_value_reset('0 0px -0.0e0')).toBe(true)
	expect(is_value_reset(parse_value('0 1px'))).toBe(false)
})

test('destructure_font_shorthand returns plain data including keywords', () => {
	expect(destructure_font_shorthand('italic 700 16px/1.5 "Open Sans", sans-serif')).toEqual({
		font_size: '16px',
		line_height: '1.5',
		font_family: '"Open Sans", sans-serif',
		keywords: [],
	})
	expect(destructure_font_shorthand('inherit 12px Arial')?.keywords).toEqual(['inherit'])
	expect(destructure_font_shorthand(parse_value('12px Arial'))).toEqual(
		destructure_font_shorthand('12px Arial'),
	)
})

test('destructure_font_shorthand returns null for values it cannot decompose', () => {
	expect(destructure_font_shorthand('var(--font)')).toBeNull()
})

test('get_prefixed_values returns the prefixed names', () => {
	expect(get_prefixed_values('-webkit-linear-gradient(red, blue)')).toEqual([
		'-webkit-linear-gradient',
	])
	expect(get_prefixed_values('1px solid red')).toEqual([])
})

test('get_value_browserhacks returns all hacks that were found', () => {
	expect(get_value_browserhacks('red\\9')).toEqual(['\\9'])
	expect(get_value_browserhacks('progid:DXImageTransform.Microsoft.gradient(a=1)')).toEqual([
		'progid:',
	])
	expect(get_value_browserhacks('expression(a) alpha(opacity=50)')).toEqual([
		'expression()',
		'alpha()',
	])
	expect(get_value_browserhacks(parse_value('red'))).toEqual([])
})
