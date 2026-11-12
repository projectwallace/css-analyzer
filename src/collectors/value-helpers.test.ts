import { test, expect } from 'vitest'
import { parse_value } from '@projectwallace/css-parser/parse-value'
import { analyze } from '../engine/analyzer.ts'
import { define_collector } from '../engine/define-collector.ts'
import { colors } from './colors.ts'
import { gradients } from './gradients.ts'
import { keywords } from './keywords.ts'
import { units } from './units.ts'
import { get_animation_names, get_first_identifier, get_list_items } from './value-helpers.ts'

function names_of(css: string): string[][] {
	const found: string[][] = []
	const collector = define_collector<number>(() => ({
		parse: { values: true },
		declaration: {
			enter(_node, ctx) {
				found.push(get_animation_names(ctx))
			},
		},
		result: () => found.length,
	}))
	analyze(css, { collector })
	return found
}

test.each([
	['animation-name: foo', ['foo']],
	['animation-name: "x y", foo', ['x y', 'foo']],
	['animation-name: none', []],
	['animation-name: inherit', []],
	['animation: 1s ease foo', ['foo']],
	['animation: inherit', []],
	['color: red', []],
	['animation-duration: 1s', []],
])('get_animation_names("%s")', (declaration, expected) => {
	expect(names_of(`a { ${declaration} }`)).toEqual([expected])
})

test('get_list_items skips the separators', () => {
	expect(get_list_items(parse_value('a, b / c')).map((item) => item.text)).toEqual(['a', 'b', 'c'])
})

test('get_first_identifier gives the name inside a function, or undefined', () => {
	expect(get_first_identifier(parse_value('var(--x)').first_child!)).toBe('--x')
	expect(get_first_identifier(parse_value('var(1px)').first_child!)).toBeUndefined()
	expect(get_first_identifier(parse_value('var()').first_child!)).toBeUndefined()
})

// Why these four: their values are names, timing and numbers, so words in them (`red` in `font-family: Red`,
// `1s` in `transition`) are not colors, units or gradients.
const skipped_properties = ['font-family', 'transition', 'animation', 'z-index'] as const
const sample_value = 'foo red 1px, calc(2em + var(--x, blue)) linear-gradient(red, blue) bar'

test.each(skipped_properties)('colors and gradients do not look inside %s', (property) => {
	const result = analyze(`a { ${property}: ${sample_value} }`, {
		colors: colors(),
		gradients: gradients(),
	})
	expect(result.colors.total).toBe(0)
	expect(result.gradients.total).toBe(0)
})

test.each(['font-family', 'z-index'])('units do not look inside %s', (property) => {
	expect(analyze(`a { ${property}: ${sample_value} }`, { units: units() }).units.total).toBe(0)
})

test('the same value is counted in a property that is not skipped (the control)', () => {
	const result = analyze(`a { margin: ${sample_value} }`, {
		colors: colors(),
		units: units(),
		gradients: gradients(),
	})
	expect(result.colors.total).toBe(4)
	expect(result.units.total).toBe(2)
	expect(result.gradients.total).toBe(1)
})

test.each(['font-family', 'z-index'])('keywords do not look inside %s', (property) => {
	expect(analyze(`a { ${property}: foo auto }`, { keywords: keywords() }).keywords.total).toBe(0)
})

test.each(['transition', 'animation'])(
	'keywords in %s are counted once, by the shorthand and not by the value walk',
	(property) => {
		const result = analyze(`a { ${property}: foo 1s auto }`, { keywords: keywords() })
		expect([...result.keywords.unique]).toEqual([['auto', { count: 1 }]])
	},
)
