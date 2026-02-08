import { test, expect, describe } from 'vitest'
import { analyze } from '../index.js'

describe('pseudo classes', () => {
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

	test('normalizes pseudo-class names', () => {
		const fixture = `
			a:hover,
			A:HOVER {}
		`
		let actual = analyze(fixture).selectors.pseudoClasses
		expect(actual.unique).toEqual({ hover: 2 })
		expect(actual.totalUnique).toBe(1)
	})

	test('can find multiple pseudo classes in one selector', () => {
		const fixture = `
			main:has(a) a:hover {}
		`
		let actual = analyze(fixture).selectors.pseudoClasses
		expect(actual.unique).toEqual({ has: 1, hover: 1 })
		expect(actual.totalUnique).toBe(2)
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
					column: 4,
					offset: 4,
					length: 7,
				},
			],
			lang: [
				{
					line: 3,
					column: 4,
					offset: 16,
					length: 10,
				},
			],
		}
		expect(actual).toEqual(expected)
	})
})

describe('pseudo elements', () => {
	test('calculates simple pseudo elements', () => {
		const actual = analyze(`
			a,
			a::before,
			a::after {}`).selectors.pseudoElements
		let expected = {
			total: 2,
			totalUnique: 2,
			uniquenessRatio: 2 / 2,
			unique: {
				before: 1,
				after: 1,
			},
		}
		expect(actual).toEqual(expected)
	})

	test('calculates pseudo elements that have children', () => {
		const actual = analyze(`
			::highlight(Name),
			::highlight(name) {}`).selectors.pseudoElements
		let expected = {
			total: 2,
			totalUnique: 1,
			uniquenessRatio: 1 / 2,
			unique: {
				highlight: 2,
			},
		}
		expect(actual).toEqual(expected)
	})

	test('normalizes pseudo element names', () => {
		const fixture = `
			a::before,
			A::BEFORE {}
		`
		let actual = analyze(fixture).selectors.pseudoElements
		expect(actual.unique).toEqual({ before: 2 })
		expect(actual.totalUnique).toBe(1)
	})

	test('can find multiple pseudo elements in one selector', () => {
		const fixture = `
			main:has(a) a:hover {}
		`
		let actual = analyze(fixture).selectors.pseudoClasses
		expect(actual.unique).toEqual({ has: 1, hover: 1 })
		expect(actual.totalUnique).toBe(2)
	})
})
