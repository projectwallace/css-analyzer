// The code in the README, as tests. If a snippet changes in the README, change it here too.
import { test, expect, expectTypeOf } from 'vitest'
import { analyze, create_counter, define_collector, summarize, to_json } from '../index.ts'
import {
	colors,
	font_sizes,
	rules,
	specificity,
	summarize_specificity,
	z_indexes,
	type ResultOf,
} from '../collectors/index.ts'
import { design_tokens_collectors } from '../presets/index.ts'

const css = `
	a { color: red; font-size: 16px; z-index: 1 }
	b { color: red; font-size: 16px; color: #fff }
	.c > d { color: red; font-size: 1rem }
`

test('Pick the metrics you need', () => {
	const result = analyze(css, {
		colors: colors(),
		font_sizes: font_sizes(),
		z: z_indexes(),
	})

	expect(result.colors.total).toBe(4)
	expect(result.colors.total_unique).toBe(2)
	expect(result.colors.unique.get('red')).toEqual({ count: 3 })
	expect([...result.font_sizes.unique]).toEqual([
		['16px', { count: 2 }],
		['1rem', { count: 1 }],
	])
	expect(result.z.total).toBe(1)
})

test('Derived numbers are separate functions', () => {
	const result = analyze(css, { colors: colors() })
	expect(summarize(result.colors)).toEqual({ uniqueness_ratio: 0.5 })

	const { s } = analyze('a {} .b {} #c {}', { s: specificity() })
	expect(Object.keys(summarize_specificity(s))).toEqual([
		'total',
		'min',
		'max',
		'sum',
		'mean',
		'mode',
	])
})

test('Serialize results', () => {
	const result = analyze(css, { colors: colors() })
	expect(JSON.parse(JSON.stringify(to_json(result.colors)))).toMatchObject({
		total: 4,
		total_unique: 2,
		unique: { red: { count: 3 }, '#fff': { count: 1 } },
	})
})

test('Locations', () => {
	const { colors: result } = analyze(css, { colors: colors({ locations: true }) })
	expect(result.unique.get('red')?.locations).toEqual([
		{ line: 2, column: 13, offset: 13, length: 3 },
		{ line: 3, column: 13, offset: 60, length: 3 },
		{ line: 4, column: 18, offset: 113, length: 3 },
	])
})

test('Ordered numbers (for charts)', () => {
	const { r } = analyze('a { b { c { color: red } } } d { }', { r: rules({ sequence: true }) })
	expect(r.sizes.sequence).toEqual([1, 1, 2, 1])
})

test('Presets can be spread and extended', () => {
	const result = analyze(css, {
		...design_tokens_collectors({ locations: true }),
		z_indexes: z_indexes(),
	})
	expect(result.z_indexes.total).toBe(1)
	expect(result.colors.unique.get('red')?.locations).toHaveLength(3)
})

test('Typing a collector map', () => {
	const collectors: {
		colors: ReturnType<typeof colors<{ contexts: true }>>
		font_sizes: ReturnType<typeof font_sizes>
	} = { colors: colors({ contexts: true }), font_sizes: font_sizes() }

	type Report = ResultOf<typeof collectors>
	const report: Report = analyze(css, collectors)
	expect(report.colors.by_context.get('color')?.total).toBe(4)
	expectTypeOf(report.font_sizes.total).toBeNumber()
})

test('Write your own collector', () => {
	function important_declarations() {
		return define_collector(function init() {
			const counter = create_counter()
			return {
				declaration: {
					enter(node, ctx) {
						// oxlint-disable-next-line vitest/no-conditional-in-test
						if (ctx.is_important) {
							counter.add(ctx.property, node)
						}
					},
				},
				result() {
					return counter.result()
				},
			}
		})
	}

	const { important } = analyze(
		'a { color: red !important; margin: 0 } b { color: blue !IMPORTANT }',
		{
			important: important_declarations(),
		},
	)
	expect(important.total).toBe(2)
	expect(important.unique.get('color')).toEqual({ count: 2 })
})
