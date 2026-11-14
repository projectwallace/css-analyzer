import { test, expect } from 'vitest'
import { analyze } from '../engine/analyzer.ts'
import { summarize_numbers } from '../engine/summary.ts'
import { value_complexity } from './value-complexity.ts'

test('calculates value complexity', () => {
	const { complexity } = analyze(
		`
    a {
			color: green; /* 1 */
			width: -webkit-max-content; /* 2 */
			color: green\\9; /* 2 */
    }
  `,
		{ complexity: value_complexity() },
	)
	const { min, max, mean, mode, range, sum } = summarize_numbers(complexity)

	expect({ min, max, mean, mode, range, sum }).toEqual({
		min: 1,
		max: 2,
		mean: 5 / 3,
		mode: 2,
		range: 1,
		sum: 5,
	})
})

test('a global keyword value has complexity 1', () => {
	const { complexity } = analyze('a { color: inherit }', { complexity: value_complexity() })
	expect(summarize_numbers(complexity).sum).toBe(1)
})

test('global keywords and custom property hacks add nothing, custom property prefixes do', () => {
	const { complexity } = analyze('a { color: inherit; --x: green\\9; --y: -webkit-box }', {
		complexity: value_complexity(),
	})
	expect([...complexity.unique]).toEqual([
		[1, { count: 2 }],
		[2, { count: 1 }],
	])
})
