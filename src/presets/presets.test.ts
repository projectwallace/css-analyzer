import { test, expect, expectTypeOf, describe } from 'vitest'
import { analyze } from '../engine/analyzer.ts'
import type { CollectorDef, CountResult } from '../engine/types.ts'
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
		])
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
