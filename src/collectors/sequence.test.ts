import { test, expect } from 'vitest'
import { analyze, create_analyzer, merge } from '../engine/analyzer.js'
import { atrules, declarations, rules, selectors, specificity } from './index.js'

const css = `
a { color: red }
.b .c { color: blue; margin: 0 }
@media (x) { @supports (y) { .d {} } }
`

test('sequence keeps the numbers in the order they were found (for charts)', () => {
	const result = analyze(css, {
		rules: rules({ sequence: true }),
		selectors: selectors({ sequence: true }),
		specificity: specificity({ sequence: true }),
		declarations: declarations({ sequence: true }),
		atrules: atrules({ sequence: true }),
	})

	expect(result.rules.sizes.sequence?.map(Number)).toEqual([2, 3, 1])
	expect(result.rules.nesting.sequence?.map(Number)).toEqual([0, 0, 2])
	expect(result.selectors.complexity.sequence?.map(Number)).toEqual([1, 2, 1])
	expect(result.selectors.nesting.sequence?.map(Number)).toEqual([0, 0, 2])
	expect(result.specificity.sequence).toEqual(['0,0,1', '0,2,0', '0,1,0'])
	expect(result.declarations.nesting.sequence?.map(Number)).toEqual([1, 1, 1])
	expect(result.atrules.nesting.sequence?.map(Number)).toEqual([0, 1])
})

test('sequence is off by default and only kept for the numeric series', () => {
	const result = analyze(css, { rules: rules(), selectors: selectors({ sequence: true }) })
	expect(result.rules.sizes.sequence).toBeUndefined()
	expect(result.selectors.sequence).toBeUndefined()
	expect(result.selectors.ids.sequence).toBeUndefined()
	expect(result.selectors.nesting.sequence).toBeDefined()
})

test('sequences are joined when results are merged or inputs are added', () => {
	const collectors = { rules: rules({ sequence: true }) }
	const a = 'a { color: red }'
	const b = '.b { color: red; margin: 0 }'

	const merged = merge(analyze(a, collectors), analyze(b, collectors))
	const incremental = create_analyzer(collectors).add(a).add(b).result()

	expect(merged.rules.sizes.sequence).toEqual(['2', '3'])
	expect(incremental.rules.sizes.sequence).toEqual(['2', '3'])
})

test('a sequence taken earlier is not changed by later input', () => {
	const analyzer = create_analyzer({ rules: rules({ sequence: true }) })
	analyzer.add('a { color: red }')
	const first = analyzer.result()
	analyzer.add('b { color: red }')
	expect(first.rules.sizes.sequence).toEqual(['2'])
})
