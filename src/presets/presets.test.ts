import { test, expect, expectTypeOf, describe } from 'vitest'
import { analyze } from '../engine/analyzer.ts'
import type { CollectorDef, CountResult } from '../engine/types.ts'
import { plain } from '../test/test-utils.ts'
import {
	all_collectors,
	analyze_all,
	analyze_design_tokens,
	design_tokens_collectors,
	type AllCollectors,
	type AllResult,
	type DesignTokensCollectors,
} from './index.ts'

// CSS that exercises every design-token collector
const tokens_fixture = `
	:root {
		--brand: #FF0000;
		--font: "Open Sans", sans-serif;
	}
	body {
		color: red;
		background: #fff url(a.png);
		border-color: RGBA(0, 0, 0, .5) transparent currentColor;
		font: italic bold 16px/1.5 "Helvetica Neue", Arial, sans-serif;
		box-shadow: 0 0 0 1px rgb(0 0 0 / 10%), 0 1px 2px #000;
		-webkit-box-shadow: 0 0 1px red;
		transition: color 200ms ease-in-out, background-color 1S cubic-bezier(0, 0, 1, 1) 0.5s;
		animation: spin 2s linear infinite;
	}
	h1 {
		font-size: 2EM;
		font-size: var(--size);
		font-size: caption;
		font-size: inherit;
		font-family: Arial, Helvetica;
		font-family: caption;
		line-height: 1.2;
		line-height: var(--lh, 1.5);
		border-radius: 4px 2px;
		border-top-left-radius: 50%;
		color: #ABC;
		color: #aabbccdd;
	}
	@media (min-width: 40em) {
		.a {
			background: linear-gradient(to right, #111 0%, #222 100%), -webkit-linear-gradient(red, blue);
			background-image: radial-gradient(circle, color-mix(in srgb, #fff, #000), transparent);
			font: 12px/14px Georgia;
			font: caption;
			font: inherit;
			animation-duration: 300ms, 1s;
			transition-duration: 0.3s;
			animation-timing-function: ease, steps(4, jump-end);
			transition-timing-function: cubic-bezier(.1, .2, .3, .4);
			animation-name: red;
			color: red\\9;
		}
	}
	@keyframes spin {
		from { transform: rotate(0deg) }
		to { transform: rotate(360deg) }
	}
`

describe('analyze_all', () => {
	test('has one snake_case key per collector', () => {
		const report = analyze_all('a { color: red }')
		expect(Object.keys(report)).toEqual(Object.keys(all_collectors()))
		expect(report.colors.total_unique).toBe(1)
		expect(report.specificity.total).toBe(1)
	})

	test('reports the source lines of code and complexity of the stylesheet', () => {
		const { stylesheet } = analyze_all('a { color: red }')
		expect(stylesheet.source_lines_of_code).toBe(2)
		expect(stylesheet.complexity).toBe(4)
	})

	test('can be extended and narrowed like any collector map', () => {
		const { colors, units } = all_collectors()
		const result = analyze('a { color: red; width: 1px }', { colors, units })
		expect(Object.keys(result)).toEqual(['colors', 'units'])
	})
})

describe('analyze_design_tokens', () => {
	test('holds the same colors as analyze_all', () => {
		const tokens = analyze_design_tokens(tokens_fixture)
		const report = analyze_all(tokens_fixture)
		expect([...tokens.colors.unique.keys()]).toEqual([...report.colors.unique.keys()])
		expect(tokens.font_sizes).toEqual(report.font_sizes)
	})

	test('uses the collector names as keys, like analyze_all', () => {
		expect(Object.keys(design_tokens_collectors())).toEqual([
			'colors',
			'font_sizes',
			'font_families',
			'line_heights',
			'gradients',
			'box_shadows',
			'border_radiuses',
			'durations',
			'timing_functions',
			'text_shadows',
			'units',
		])
	})

	test('reports every token collector for a small stylesheet', () => {
		const css = `
			:root { --brand: #FF0000 }
			body {
				color: red;
				background: #fff linear-gradient(to right, #111, #222);
				font: italic bold 16px/1.5 "Helvetica Neue", Arial;
				box-shadow: 0 0 1px #000;
				text-shadow: 0 1px 2px rgb(0 0 0 / 50%);
				border-radius: 4px 2px;
				transition: color 200ms ease-in-out;
				margin: 1EM 2px;
			}
			h1 {
				font-size: 2rem;
				font-family: Arial, Helvetica;
				line-height: 1.2;
				animation-duration: 1s;
				animation-timing-function: steps(4, jump-end);
			}
		`
		const tokens = analyze_design_tokens(css)
		function counted(items: Record<string, number>) {
			return {
				total: Object.values(items).reduce((sum, count) => sum + count, 0),
				total_unique: Object.keys(items).length,
				unique: items,
			}
		}

		expect(plain(tokens.colors)).toEqual({
			...counted({
				'#ff0000': 1,
				red: 1,
				'#fff': 1,
				'#111': 1,
				'#222': 1,
				'#000': 1,
				'rgb(0 0 0 / 50%)': 1,
			}),
			by_context: {
				'--brand': counted({ '#ff0000': 1 }),
				color: counted({ red: 1 }),
				background: counted({ '#fff': 1, '#111': 1, '#222': 1 }),
				'box-shadow': counted({ '#000': 1 }),
				'text-shadow': counted({ 'rgb(0 0 0 / 50%)': 1 }),
			},
			formats: { total: 7, total_unique: 4, unique: { hex6: 1, named: 1, hex3: 4, rgb: 1 } },
		})
		expect(plain(tokens.font_sizes)).toEqual(counted({ '16px': 1, '2rem': 1 }))
		expect(plain(tokens.font_families)).toEqual(
			counted({ '"Helvetica Neue", Arial': 1, 'Arial, Helvetica': 1 }),
		)
		expect(plain(tokens.line_heights)).toEqual(counted({ '1.5': 1, '1.2': 1 }))
		expect(plain(tokens.gradients)).toEqual(counted({ 'linear-gradient(to right, #111, #222)': 1 }))
		expect(plain(tokens.box_shadows)).toEqual(counted({ '0 0 1px #000': 1 }))
		expect(plain(tokens.border_radiuses)).toEqual({
			...counted({ '4px 2px': 1 }),
			by_context: { 'border-radius': counted({ '4px 2px': 1 }) },
		})
		expect(plain(tokens.durations)).toEqual(counted({ '200ms': 1, '1s': 1 }))
		expect(plain(tokens.timing_functions)).toEqual(
			counted({ 'ease-in-out': 1, 'steps(4, jump-end)': 1 }),
		)
		expect(plain(tokens.text_shadows)).toEqual(counted({ '0 1px 2px rgb(0 0 0 / 50%)': 1 }))
		expect(plain(tokens.units)).toEqual({
			...counted({ px: 7, '%': 1, ms: 1, em: 1, rem: 1, s: 1 }),
			by_context: {
				font: counted({ px: 1 }),
				'box-shadow': counted({ px: 1 }),
				'text-shadow': counted({ px: 2, '%': 1 }),
				'border-radius': counted({ px: 2 }),
				transition: counted({ ms: 1 }),
				margin: counted({ em: 1, px: 1 }),
				'font-size': counted({ rem: 1 }),
				'animation-duration': counted({ s: 1 }),
			},
		})
	})
})

describe('preset options', () => {
	const css = 'a { color: red; font-size: 12px; border-radius: 4px; transition: color 1s ease-in }'

	test('locations are off by default and can be turned on for every collector', () => {
		const without = analyze_design_tokens(css)
		expect(without.colors.unique.get('red')?.locations).toBeUndefined()

		const tokens = analyze_design_tokens(css, { locations: true })
		for (const key of Object.keys(tokens) as (keyof typeof tokens)[]) {
			for (const entry of tokens[key].unique.values()) {
				expect(entry.locations?.length).toBeGreaterThan(0)
			}
		}
		expect(analyze_all(css, { locations: true }).z_indexes.unique.size).toBe(0)
		expect(analyze_all(css, { locations: true }).colors.unique.get('red')?.locations).toHaveLength(
			1,
		)
	})

	test('the collector maps can be spread and extended', () => {
		const result = analyze(css, { ...design_tokens_collectors({ locations: true }) })
		expect(result.font_sizes.unique.get('12px')?.locations).toHaveLength(1)
	})

	test('the type of the map is exported, so it never has to be written by hand', () => {
		expectTypeOf(design_tokens_collectors()).toEqualTypeOf<DesignTokensCollectors>()
		expectTypeOf(design_tokens_collectors().font_sizes).toEqualTypeOf<CollectorDef<CountResult>>()
	})
})

describe('collector maps stay in sync', () => {
	test('analyze_all has a collector for every collector the package exports', async () => {
		const exported = Object.keys(await import('../collectors/index.ts')).filter(
			(name) => name !== 'summarize_specificity',
		)
		expect(Object.keys(all_collectors()).sort()).toEqual(exported.sort())
	})

	test('the key lists of the preset types are the keys of the maps', () => {
		expectTypeOf<keyof AllCollectors>().toEqualTypeOf<keyof ReturnType<typeof all_collectors>>()
		expectTypeOf<keyof DesignTokensCollectors>().toEqualTypeOf<
			keyof ReturnType<typeof design_tokens_collectors>
		>()
	})

	test('the per-property collectors of the presets have by_context', () => {
		expectTypeOf<AllResult['colors']>().toHaveProperty('by_context')
		expectTypeOf<AllResult['units']>().toHaveProperty('by_context')
		expectTypeOf<AllResult['border_radiuses']>().toHaveProperty('by_context')
		expectTypeOf<AllResult['font_sizes']>().not.toHaveProperty('by_context')
	})
})
