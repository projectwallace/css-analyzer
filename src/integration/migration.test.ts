// One test per behaviour change that MIGRATION.md announces ("Behaviour changes" and the per-property rule).
import { test, expect } from 'vitest'
import { analyze } from '../engine/analyzer.ts'
import {
	atrules,
	border_radiuses,
	colors,
	durations,
	font_sizes,
	properties,
	stylesheet,
	timing_functions,
	units,
} from '../collectors/index.ts'

test.each([
	['font-family', 'font-family: var(--a)'],
	['transition', 'transition: color var(--a)'],
	['animation', 'animation: var(--a) 1s'],
	['z-index', 'z-index: var(--a)'],
	['color', 'color: var(--a)'],
])('var() is a use of a custom property in %s', (_property, declaration) => {
	const { props } = analyze(`:root { --a: 1 } a { ${declaration} }`, { props: properties() })
	expect(props.custom.used).toEqual(['--a'])
	expect(props.custom.unused).toEqual([])
})

test('a longhand timing function is lowercased, like every other value', () => {
	const css = 'a { transition-timing-function: EASE-IN; transition: all 1s EASE-OUT }'
	const { timing } = analyze(css, { timing: timing_functions() })
	expect([...timing.unique.keys()]).toEqual(['ease-in', 'ease-out'])
})

test('a longhand duration is lowercased, like every other value', () => {
	const { result } = analyze('a { transition-duration: 1S; transition: all 2S }', {
		result: durations(),
	})
	expect([...result.unique.keys()]).toEqual(['1s', '2s'])
})

test('the size in the font shorthand is lowercased', () => {
	const { sizes } = analyze('a { font: 10PX/1 sans-serif }', { sizes: font_sizes() })
	expect([...sizes.unique.keys()]).toEqual(['10px'])
})

test('values with var() keep their case', () => {
	const { sizes } = analyze('a { font-size: var(--Size, 12PX) }', { sizes: font_sizes() })
	expect([...sizes.unique.keys()]).toEqual(['var(--Size, 12PX)'])
})

test('data: URIs in @import preludes are not counted as embedded content', () => {
	const css =
		'@import url("data:text/css;base64,YQ=="); a { background: url(data:image/gif;base64,R0lG) }'
	const { sheet, at } = analyze(css, { sheet: stylesheet(), at: atrules() })
	expect(sheet.embedded.total).toBe(1)
	expect([...sheet.embedded.unique.keys()]).toEqual(['image/gif'])
	expect(at.imports.total).toBe(1)
})

test('per-property counts use the normalized property by default', () => {
	const css = 'a { -WEBKIT-border-radius: 1px; BORDER-RADIUS: 2px; _border-radius: 3px }'
	const normalized = analyze(css, { result: border_radiuses({ contexts: true }) }).result
	expect([...normalized.by_context.keys()]).toEqual(['border-radius'])
	expect(normalized.by_context.get('border-radius')?.total).toBe(3)
})

test("property: 'as_written' keeps the property as it was written", () => {
	const css = 'a { -WEBKIT-border-radius: 1px; BORDER-RADIUS: 2px }'
	const written = analyze(css, {
		result: border_radiuses({ contexts: true, property: 'as_written' }),
	}).result
	expect([...written.by_context.keys()]).toEqual(['-WEBKIT-border-radius', 'BORDER-RADIUS'])
})

test('the same normalization applies to colors and units', () => {
	const css = 'a { -WEBKIT-Box-Shadow: 1PX 1px red; COLOR: red }'
	const result = analyze(css, {
		colors: colors({ contexts: true }),
		units: units({ contexts: true }),
	})
	expect([...result.colors.by_context.keys()]).toEqual(['box-shadow', 'color'])
	expect([...result.units.by_context.keys()]).toEqual(['box-shadow'])
})

test('by_context only exists when contexts is true', () => {
	const css = 'a { color: red }'
	expect('by_context' in analyze(css, { c: colors() }).c).toBe(false)
	expect('by_context' in analyze(css, { c: colors({ contexts: true }) }).c).toBe(true)
})

test('animation-name: red is not a color', () => {
	const { c } = analyze('a { animation-name: red; animation: red 1s }', { c: colors() })
	expect(c.total).toBe(0)
})
