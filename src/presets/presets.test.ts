import { test, expect, expectTypeOf, describe } from 'vitest'
import { analyze } from '../engine/analyzer.ts'
import { tokens_fixture } from '../test/test-fixture.ts'
import type { CollectorDef, CountResult } from '../engine/types.ts'
import {
	all_collectors,
	analyze_all,
	analyze_design_tokens,
	design_tokens_collectors,
	type DesignTokensCollectors,
} from './index.ts'

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
