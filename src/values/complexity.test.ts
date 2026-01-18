import { test } from 'vitest'
import { expect } from 'vitest'
import { analyze } from '../index.js'

test('calculates value complexity', () => {
	const fixture = `
    a {
			color: green; /* 1 */
			width: -webkit-max-content; /* 2 */
			color: green\\9; /* 2 */
    }
  `
	const actual = analyze(fixture).values.complexity
	const expected = {
		min: 1,
		max: 2,
		mean: 5 / 3,
		mode: 2,
		range: 1,
		sum: 5,
	}

	expect(actual).toEqual(expected)
})
