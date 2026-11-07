import { test, expect, describe } from 'vitest'
import { analyze as analyze_legacy } from '../index.js'
import { analyze, create_analyzer, merge } from '../engine/analyzer.js'
import { colors } from './colors.js'
import { specificity, summarize_specificity } from './specificity.js'
import { z_indexes } from './z-indexes.js'

const fixture = `
	a { color: red; z-index: 1 }
	a.b > #c { color: blue; z-index: 10 }
	a:not(.x, #y):is(.p, .q) { z-index: 10 }
	.card:where(#id, .other) .title, ul li:nth-child(2n + 1) { z-index: var(--layer) }
	@media (min-width: 40em) { .m { z-index: auto } .n.o { z-index: 3\\9; } }
	@keyframes k { from { top: 0 } 50% { top: 1px } to { top: 2px } }
	@supports (display: grid) { div > p ~ span { z-index: 7 } }
`

describe('max-unique-z-indexes', () => {
	test('matches the 9.x analyzer', () => {
		const legacy = analyze_legacy(fixture).values.zindexes
		const { z } = analyze(fixture, { z: z_indexes() })

		expect(Object.fromEntries([...z.unique].map(([item, { count }]) => [item, count]))).toEqual(
			legacy.unique,
		)
		expect(z.total).toBe(legacy.total)
		expect(z.total_unique).toBe(legacy.totalUnique)
	})

	test('reports where each value lives so a rule can point at it', () => {
		const { z } = analyze('a { z-index: 5 }\nb { z-index: 5 }', {
			z: z_indexes({ locations: true }),
		})
		expect(z.unique.get('5')?.locations?.map((loc) => [loc.line, loc.column])).toEqual([
			[1, 14],
			[2, 14],
		])
	})
})

describe('max-unique-colors', () => {
	test('counts unique colors in one pass with the other collectors', () => {
		const result = analyze(fixture, { colors: colors(), z: z_indexes() })
		expect(result.colors.total_unique).toBe(2)
	})
})

describe('max-average-selector-specificity', () => {
	test('matches the 9.x analyzer', () => {
		const legacy = analyze_legacy(fixture).selectors.specificity
		const { s } = analyze(fixture, { s: specificity() })
		const summary = summarize_specificity(s)

		expect(summary.total).toBe(s.total)
		expect(summary.min).toEqual(legacy.min)
		expect(summary.max).toEqual(legacy.max)
		expect(summary.sum).toEqual(legacy.sum)
		expect(summary.mean).toEqual(legacy.mean)
		expect(summary.mode).toEqual(legacy.mode)
		expect(Object.fromEntries([...s.unique].map(([item, { count }]) => [item, count]))).toEqual(
			legacy.unique,
		)
	})

	test('does not count selectors inside :is(), :not() or keyframes twice', () => {
		const { s } = analyze('a:not(.x, #y) {} @keyframes k { from {} 50% {} }', { s: specificity() })
		expect(s.total).toBe(1)
		expect([...s.unique.keys()]).toEqual(['1,0,1'])
	})

	test('an empty stylesheet summarizes to zeros', () => {
		const { s } = analyze('', { s: specificity() })
		expect(summarize_specificity(s)).toEqual({
			total: 0,
			min: [0, 0, 0],
			max: [0, 0, 0],
			sum: [0, 0, 0],
			mean: [0, 0, 0],
			mode: [0, 0, 0],
		})
	})

	test('the average over several files equals the average over their concatenation', () => {
		const a = 'a {} a b {} #x {}'
		const b = '.c {} .d .e {}'
		const collectors = { s: specificity() }

		const incremental = create_analyzer(collectors)
			.add(a, { source: 'a.css' })
			.add(b, { source: 'b.css' })
		const merged = merge(analyze(a, collectors), analyze(b, collectors))
		const together = analyze(`${a}\n${b}`, collectors)

		expect(summarize_specificity(incremental.result().s)).toEqual(summarize_specificity(together.s))
		expect(summarize_specificity(merged.s)).toEqual(summarize_specificity(together.s))
	})

	test('only asks the parser for selectors', () => {
		expect(create_analyzer({ s: specificity() }).parse_options).toEqual({
			selectors: true,
			values: false,
			atrule_preludes: false,
		})
	})
})
