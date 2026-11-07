import { test, expect, describe } from 'vitest'
import { analyze, create_analyzer, merge } from '../engine/analyzer.js'
import { stylesheet_fixture, tokens_fixture } from '../test-fixture.js'
import { all_collectors, analyze_all, analyze_design_tokens } from './index.js'

describe('analyze_all', () => {
	test('has one snake_case key per collector', () => {
		const report = analyze_all('a { color: red }')
		expect(Object.keys(report)).toEqual(Object.keys(all_collectors))
		expect(report.colors.total_unique).toBe(1)
		expect(report.specificity.total).toBe(1)
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
