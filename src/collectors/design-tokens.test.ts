import { test, expect, describe } from 'vitest'
import { analyze } from '../engine/analyzer.ts'
import type { CountResult } from '../engine/types.ts'
import {
	border_radiuses,
	box_shadows,
	colors,
	durations,
	font_families,
	font_sizes,
	gradients,
	line_heights,
	timing_functions,
} from './index.ts'

/** Compare on counts only: the legacy shape has `unique` as a plain record */
function counts(result: CountResult): Record<string, number> {
	return Object.fromEntries([...result.unique].map(([item, { count }]) => [item, count]))
}

describe('options', () => {
	test('locations point at the value node (or the token for colors and gradients)', () => {
		const css = 'a { color: red; font-size: 12px; background: linear-gradient(red, blue) }'
		const result = analyze(css, {
			colors: colors({ locations: true }),
			font_sizes: font_sizes({ locations: true }),
			gradients: gradients({ locations: true }),
		})

		expect(result.font_sizes.unique.get('12px')?.locations).toEqual([
			{ line: 1, column: 28, offset: 27, length: 4 },
		])
		expect(result.colors.unique.get('red')?.locations).toHaveLength(2)
		expect(result.gradients.unique.get('linear-gradient(red, blue)')?.locations?.[0]).toEqual({
			line: 1,
			column: 46,
			offset: 45,
			length: 26,
		})
	})

	test('locations are off by default', () => {
		const { colors: result } = analyze('a { color: red }', { colors: colors() })
		expect(result.unique.get('red')).toEqual({ count: 1 })
	})

	test('colors: normalize none keeps authored values; by_context only with contexts', () => {
		const css = 'a { color: RED; background: #FFF }'
		const lowercase = analyze(css, { colors: colors({ contexts: true }) }).colors
		expect([...lowercase.unique.keys()]).toEqual(['red', '#fff'])
		expect(lowercase.by_context.get('color')?.total).toBe(1)

		const authored = analyze(css, { colors: colors({ normalize: 'none' }) }).colors
		expect([...authored.unique.keys()]).toEqual(['RED', '#FFF'])
		expect('by_context' in authored).toBe(false)
	})

	test('font sizes, families and line heights can skip var()', () => {
		const css = 'a { font-size: var(--s); font-family: var(--f), serif; line-height: var(--l) }'
		const result = analyze(css, {
			sizes: font_sizes({ skip_var: true }),
			families: font_families({ skip_var: true }),
			heights: line_heights({ skip_var: true }),
			all_sizes: font_sizes(),
		})
		expect(result.sizes.total).toBe(0)
		expect(result.families.total).toBe(0)
		expect(result.heights.total).toBe(0)
		expect([...result.all_sizes.unique.keys()]).toEqual(['var(--s)'])
	})

	test('font sizes: normalize none keeps authored case', () => {
		const result = analyze('a { font-size: 2EM }', { sizes: font_sizes({ normalize: 'none' }) })
		expect([...result.sizes.unique.keys()]).toEqual(['2EM'])
	})
})

describe('behaviour', () => {
	test('the font shorthand feeds sizes, families and line heights from one split', () => {
		const result = analyze('a { font: italic 700 16px/1.5 "Open Sans", sans-serif }', {
			sizes: font_sizes(),
			families: font_families(),
			heights: line_heights(),
		})
		expect(counts(result.sizes)).toEqual({ '16px': 1 })
		expect(counts(result.families)).toEqual({ '"Open Sans", sans-serif': 1 })
		expect(counts(result.heights)).toEqual({ '1.5': 1 })
	})

	test('global keywords and system fonts are ignored', () => {
		const result = analyze('a { font: caption; font-size: inherit; font-family: caption }', {
			sizes: font_sizes(),
			families: font_families(),
			heights: line_heights(),
		})
		expect(result.sizes.total + result.families.total + result.heights.total).toBe(0)
	})

	test('font family names and animation names are not colors', () => {
		const result = analyze('a { font-family: Black; animation: red 1s; transition: blue 1s }', {
			colors: colors(),
		})
		expect(result.colors.total).toBe(0)
	})

	test('a trailing IE hack is not part of the value', () => {
		const result = analyze('a { font-size: 12px\\9; box-shadow: 0 0 1px red\\9; }', {
			sizes: font_sizes(),
			shadows: box_shadows(),
		})
		expect([...result.sizes.unique.keys()]).toEqual(['12px'])
		expect([...result.shadows.unique.keys()]).toEqual(['0 0 1px red'])
	})

	test('durations and timing functions come from shorthands and longhands', () => {
		const result = analyze(
			'a { transition: color 200ms ease-in; animation-duration: 1S, 2s; animation-timing-function: steps(4) }',
			{ durations: durations(), easings: timing_functions() },
		)
		expect(counts(result.durations)).toEqual({ '200ms': 1, '1s': 1, '2s': 1 })
		expect(counts(result.easings)).toEqual({ 'ease-in': 1, 'steps(4)': 1 })
	})

	test('radii are counted per property when asked', () => {
		const result = analyze(
			'a { border-radius: 4px; -webkit-border-radius: 4px; border-top-left-radius: 2px }',
			{
				radii: border_radiuses({ contexts: true }),
			},
		)
		expect(counts(result.radii)).toEqual({ '4px': 2, '2px': 1 })
		expect(counts(result.radii.by_context.get('border-radius')!)).toEqual({ '4px': 2 })
	})
})
