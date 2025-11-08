import { test, expect } from 'vitest'
import { analyze } from '../index.js'

test('calculates pseudo classes', () => {
	const actual = analyze(`
		a,
		a:hover,
		a:active,
		a:lang(en),
		a:dir(ltr),
		a:dir(ltr),
		a:has(.thing) {}`).selectors.pseudoClasses
	let expected = {
		total: 6,
		totalUnique: 5,
		uniquenessRatio: 5 / 6,
		unique: {
			hover: 1,
			active: 1,
			lang: 1,
			dir: 2,
			has: 1,
		},
	}
	expect(actual).toEqual(expected)
})

test('logs the whole parent selector when using locations', () => {
	let actual = analyze(
		`
		a:hover,
		a:lang(en) {}`,
		{ useLocations: true },
	).selectors.pseudoClasses.uniqueWithLocations
	let expected = {
		hover: [
			{
				line: 2,
				column: 3,
				offset: 3,
				length: 7,
			},
		],
		lang: [
			{
				line: 3,
				column: 3,
				offset: 14,
				length: 10,
			},
		],
	}
	expect(actual).toEqual(expected)
})
