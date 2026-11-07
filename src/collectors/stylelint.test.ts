import { test, expect, describe } from 'vitest'
import { analyze, create_analyzer } from '../engine/analyzer.js'
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
	test('counts every z-index value (the same numbers as 9.x)', () => {
		const { z } = analyze(fixture, { z: z_indexes() })

		expect(Object.fromEntries([...z.unique].map(([item, { count }]) => [item, count]))).toEqual({
			'1': 1,
			'3': 1,
			'7': 1,
			'10': 2,
			'var(--layer)': 1,
		})
		expect(z.total).toBe(6)
		expect(z.total_unique).toBe(5)
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
	test('summarizes like the 9.x analyzer', () => {
		const { s } = analyze(fixture, { s: specificity() })
		const summary = summarize_specificity(s)

		expect(summary).toEqual({
			total: 8,
			min: [0, 0, 1],
			max: [1, 1, 1],
			sum: [2, 8, 8],
			mean: [0.25, 1, 1],
			mode: [0, 1, 0.5],
		})
		expect(Object.fromEntries([...s.unique].map(([item, { count }]) => [item, count]))).toEqual({
			'0,0,1': 1,
			'1,1,1': 2,
			'0,2,0': 2,
			'0,1,2': 1,
			'0,1,0': 1,
			'0,0,3': 1,
		})
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

	test('the average over several added files equals the average over their concatenation', () => {
		const a = 'a {} a b {} #x {}'
		const b = '.c {} .d .e {}'
		const collectors = { s: specificity() }

		const incremental = create_analyzer(collectors)
			.add(a, { source: 'a.css' })
			.add(b, { source: 'b.css' })
		const together = analyze(`${a}\n${b}`, collectors)

		expect(summarize_specificity(incremental.result().s)).toEqual(summarize_specificity(together.s))
	})

	test('only asks the parser for selectors', () => {
		expect(create_analyzer({ s: specificity() }).parse_options).toEqual({
			selectors: true,
			values: false,
			atrule_preludes: false,
		})
	})
})
