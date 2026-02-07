import { test } from 'vitest'
import { expect } from 'vitest'
import { analyze } from '../index.js'

test('finds global keywords', () => {
	const fixture = `
		test {
			/* Global values */
			line-height: inherit;
			line-height: initial;
			line-height: revert;
			line-height: revert-layer;
			line-height: unset;

      font: inherit;
      font: initial;
      font: revert;
      font: revert-layer;
      font: unset;
		}
	`
	const actual = analyze(fixture).values.keywords
	const expected = {
		total: 10,
		totalUnique: 5,
		unique: {
			inherit: 2,
			initial: 2,
			revert: 2,
			'revert-layer': 2,
			unset: 2,
		},
		uniquenessRatio: 5 / 10,
	}

	expect(actual).toEqual(expected)
})

test('normalizes keyword casing', () => {
	const fixture = `
		test {
			/* Global values */
			line-height: inherit;
			line-height: INHERIT;
		}
	`
	const actual = analyze(fixture).values.keywords
	const expected = {
		total: 2,
		totalUnique: 1,
		unique: {
			inherit: 2,
		},
		uniquenessRatio: 1 / 2,
	}

	expect(actual).toEqual(expected)
})

test('finds global keywords in shorthands', () => {
	let fixture = `
		a {
			animation: myAnimation 2s infinite inherit;
			margin: 0 auto;
			font: italic bold 16px/1.5 Arial, sans-serif inherit;
		}
	`
	let actual = analyze(fixture).values.keywords
	let expected = {
		total: 3,
		totalUnique: 2,
		unique: {
			inherit: 2,
			auto: 1,
		},
		uniquenessRatio: 2 / 3,
	}

	expect(actual).toEqual(expected)
})

test('finds global keywords in multi-values', () => {
	let fixture = `
		a {
			background-size: auto, 50%;
			animation: myAnimation1 2s infinite inherit, myAnimation2 2s infinite inherit;
		}
	`
	let actual = analyze(fixture).values.keywords
	let expected = {
		total: 3,
		totalUnique: 2,
		unique: {
			auto: 1,
			inherit: 2,
		},
		uniquenessRatio: 2 / 3,
	}

	expect(actual).toEqual(expected)
})
