import { test, expect, describe } from 'vitest'
import { analyze as analyze_legacy } from '../index.js'
import { analyze, create_analyzer, merge } from '../engine/analyzer.js'
import { stylesheet_fixture, tokens_fixture } from '../test-fixture.js'
import { all_collectors, analyze_all, analyze_compat, analyze_design_tokens } from './index.js'

/** What 9.x added that v10 intentionally dropped */
function without_removed_fields(value: unknown): unknown {
	if (Array.isArray(value)) return value.map((item) => without_removed_fields(item))
	if (value !== null && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value)
				.filter(([key]) => key !== '__meta__' && key !== 'uniqueWithLocations')
				.map(([key, item]) => [key, without_removed_fields(item)]),
		)
	}
	return value
}

describe('analyze_compat', () => {
	test.each([
		['the stylesheet fixture', stylesheet_fixture],
		['the design tokens fixture', tokens_fixture],
		['an empty stylesheet', ''],
		['a stylesheet with a single rule', 'a { color: red }'],
	])('gives the 9.x report for %s', (_name, css) => {
		expect(analyze_compat(css)).toEqual(without_removed_fields(analyze_legacy(css)))
	})

	test('uses camelCase keys and the nested 9.x shape', () => {
		const report = analyze_compat('a { color: red }')
		expect(report.values.colors.totalUnique).toBe(1)
		expect(report.stylesheet.sourceLinesOfCode).toBe(2)
		expect(Object.keys(report)).toEqual([
			'stylesheet',
			'atrules',
			'rules',
			'selectors',
			'declarations',
			'properties',
			'values',
		])
	})
})

describe('analyze_all', () => {
	test('has one snake_case key per collector', () => {
		const report = analyze_all('a { color: red }')
		expect(Object.keys(report)).toEqual(Object.keys(all_collectors))
		expect(report.colors.total_unique).toBe(1)
		expect(report.specificity.total).toBe(1)
	})

	test('holds the same data as the 9.x report', () => {
		const report = analyze_all(stylesheet_fixture)
		const legacy = analyze_legacy(stylesheet_fixture)
		expect(report.rules.total).toBe(legacy.rules.total)
		expect(report.colors.total).toBe(legacy.values.colors.total)
		expect(report.atrules.total).toBe(legacy.atrules.total)
	})

	test('results of separate runs merge, and equal the incremental result', () => {
		const a = 'a { color: red; z-index: 1 } @keyframes k { to { top: 0 } }'
		const b = 'b { color: blue; z-index: 2; animation: k 1s }'
		const merged = merge(analyze_all(a), analyze_all(b))
		const incremental = create_analyzer(all_collectors).add(a).add(b).result()
		expect(merged).toEqual(incremental)
	})

	test('parses everything: it is the most expensive set', () => {
		expect(create_analyzer(all_collectors).parse_options).toEqual({
			selectors: true,
			values: true,
			atrule_preludes: true,
		})
	})

	test('can be extended and narrowed like any collector map', () => {
		const { colors, units } = all_collectors
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
})
