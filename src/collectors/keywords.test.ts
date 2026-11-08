import { test, expect, describe } from 'vitest'
import { analyze } from '../engine/analyzer.ts'
import { plain } from '../test-utils.ts'
import { keywords } from './values.ts'

function run(css: string) {
	return plain(analyze(css, { result: keywords() }).result)
}

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
	const actual = run(fixture)
	const expected = {
		total: 10,
		total_unique: 5,
		unique: {
			inherit: 2,
			initial: 2,
			revert: 2,
			'revert-layer': 2,
			unset: 2,
		},
	}

	expect(actual).toEqual(expected)
})

test('normalizes keyword casing', () => {
	const fixture = `
		test {
			/* Global values */
			line-height: inherit;
			line-height: INHERIT;
			font: 10px/12px INHERIT;
		}
	`
	const actual = run(fixture)
	const expected = {
		total: 3,
		total_unique: 1,
		unique: {
			inherit: 3,
		},
	}

	expect(actual).toEqual(expected)
})

test('finds global keywords in shorthands', () => {
	const fixture = `
		a {
			animation: myAnimation 2s infinite inherit;
			margin: 0 auto;
			font: italic bold 16px/1.5 Arial, sans-serif inherit;
		}
	`
	const actual = run(fixture)
	const expected = {
		total: 3,
		total_unique: 2,
		unique: {
			inherit: 2,
			auto: 1,
		},
	}

	expect(actual).toEqual(expected)
})

test('finds global keywords in multi-values', () => {
	const fixture = `
		a {
			background-size: auto, 50%;
			animation: myAnimation1 2s infinite inherit, myAnimation2 2s infinite inherit;
		}
	`
	const actual = run(fixture)
	const expected = {
		total: 3,
		total_unique: 2,
		unique: {
			auto: 1,
			inherit: 2,
		},
	}

	expect(actual).toEqual(expected)
})

describe('keywords in the font shorthand', () => {
	test('global keywords inside the shorthand are counted', () => {
		// "inherit" appears after font-family — unusual but should be recorded
		expect(
			run('a { font: italic bold 16px/1.5 Arial, sans-serif inherit; }').unique['inherit'],
		).toBe(1)
	})

	test('a global value for the whole font property is counted as keyword', () => {
		expect(
			run(`a {
			font: inherit;
			font: initial;
			font: revert;
			font: revert-layer;
			font: unset;
		}`).unique,
		).toEqual({
			inherit: 1,
			initial: 1,
			revert: 1,
			'revert-layer': 1,
			unset: 1,
		})
	})

	test('an uppercased keyword is lowercased', () => {
		expect(run('a { font: 10PX/12PX INHERIT; }').unique).toEqual({ inherit: 1 })
	})
})
