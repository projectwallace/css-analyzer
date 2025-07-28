import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { analyze } from '../index.js'

const test = suite('Value complexity')

test('calculates value complexity', () => {
	const fixture = `
    a {
			color: green; /* 1 */
			color: green !ie; /* 2 */
			width: -webkit-max-content; /* 2 */
			width: -webkit-max-content !ie; /* 3 */
			color: green\\9; /* 2 */
    }
  `
	const actual = analyze(fixture).values.complexity
	const expected = {
		min: 1,
		max: 3,
		mean: 10 / 5,
		mode: 2,
		range: 2,
		sum: 10,
	}

	assert.equal(actual, expected)
})

test.run()
