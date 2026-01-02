import { test } from 'vitest'
import { expect } from 'vitest'
import { analyze } from '../index.js'

test('calculates value complexity', () => {
	const fixture = `
    a {
			color: green; /* 1 */
			color: green !ie; /* 2 */
			width: -webkit-max-content; /* 2 */
			width: -webkit-max-content !ie; /* 2 */
			color: green\\9; /* 1 */
    }
  `
	const actual = analyze(fixture).values.complexity
	const expected = {
		min: 1,
		max: 2,
		mean: 7 / 5,
		mode: 1,
		range: 1,
		sum: 7,
	}

	expect(actual).toEqual(expected)
})
