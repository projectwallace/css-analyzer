import { test, expect } from 'vitest'
import { parse_value } from '@projectwallace/css-parser/parse-value'
import { destructure_font_shorthand } from './destructure-font-shorthand.ts'

type Parts = { font_size?: string; line_height?: string; font_family?: string | null }

function parts(value: string): Parts {
	const { keywords: _keywords, ...rest } = destructure_font_shorthand(value)!
	return rest
}

test.each<[string, Parts]>([
	['large "Noto Sans"', { font_size: 'large', font_family: '"Noto Sans"' }],
	['12px sans-serif', { font_size: '12px', font_family: 'sans-serif' }],
	['normal normal 1.2em serif', { font_size: '1.2em', font_family: 'serif' }],
	['400 1.3em/1 serif', { font_size: '1.3em', line_height: '1', font_family: 'serif' }],
	['italic 16px serif', { font_size: '16px', font_family: 'serif' }],
	['bold 1rem monospace', { font_size: '1rem', font_family: 'monospace' }],
	[
		'small-caps bold condensed 14px/1.4 "My Font", serif',
		{ font_size: '14px', line_height: '1.4', font_family: '"My Font", serif' },
	],
	[
		'100% Source Code Pro, Inconsolata, Menlo, monospace',
		{ font_size: '100%', font_family: 'Source Code Pro, Inconsolata, Menlo, monospace' },
	],
	['0/0 a', { font_size: '0', line_height: '0', font_family: 'a' }],
	['var(--size) serif', { font_size: 'var(--size)', font_family: 'serif' }],
	['var(--size)/1 serif', { font_size: 'var(--size)', line_height: '1', font_family: 'serif' }],
	['calc(1em + 2px) serif', { font_size: 'calc(1em + 2px)', font_family: 'serif' }],
])('splits "%s"', (value, expected) => {
	expect(parts(value)).toEqual(expected)
})

test.each(['1em / 1 serif', '1em/ 1 serif', '1em /1 serif'])(
	'allows spaces around the slash in "%s"',
	(value) => {
		expect(parts(value)).toEqual({ font_size: '1em', line_height: '1', font_family: 'serif' })
	},
)

test('a font without a family has no family', () => {
	expect(destructure_font_shorthand('1.2em/1.2em')?.font_family).toBeFalsy()
})

test('global keywords are returned, not called back', () => {
	expect(destructure_font_shorthand('inherit 12px Arial')?.keywords).toEqual(['inherit'])
	expect(destructure_font_shorthand('10px/12px Arial inherit')?.keywords).toEqual(['inherit'])
})

test('a lone var() cannot be split', () => {
	expect(destructure_font_shorthand('var(--font)')).toBeNull()
	expect(destructure_font_shorthand('var(--x, )')).toBeNull()
})

test('accepts a parsed value as well as text', () => {
	expect(destructure_font_shorthand(parse_value('12px Arial'))).toEqual(
		destructure_font_shorthand('12px Arial'),
	)
})
