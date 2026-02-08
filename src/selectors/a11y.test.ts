import { test, expect } from 'vitest'
import { analyze } from '../index.js'

test('counts Accessibility selectors', () => {
	const fixture = `
		.test,
    [aria-hidden],
    img[role="presentation"],
    body.intent-mouse [role=tabpanel][tabindex="0"]:focus {}
  `
	const actual = analyze(fixture).selectors.accessibility
	const expected = {
		total: 3,
		totalUnique: 3,
		unique: {
			'[aria-hidden]': 1,
			'[role="presentation"]': 1,
			'[role="tabpanel"]': 1,
		},
		uniquenessRatio: 3 / 3,
		ratio: 3 / 4,
	}

	expect(actual).toEqual(expected)
})

test('finds selectors within pseudo classes', () => {
	const fixture = `
    .selector:not([role="tablist"]) {}
  `
	const actual = analyze(fixture).selectors.accessibility
	expect(actual.unique).toEqual({ '[role="tablist"]': 1 })
})

test('groups by attribute & value', () => {
	const fixture = `
    [aria-hidden],
    [ARIA-HIDDEN],
    [ROLE=tablist],
    [ROLE="tablist"],
    body.intent-mouse [role=tablist][tabindex="0"]:focus {}
  `
	const actual = analyze(fixture).selectors.accessibility
	const expected = {
		total: 5,
		totalUnique: 2,
		unique: {
			'[aria-hidden]': 2,
			'[role="tablist"]': 3,
		},
		uniquenessRatio: 2 / 5,
		ratio: 5 / 5,
	}

	expect(actual).toEqual(expected)
})

test('handles attribute selector flags', () => {
	const fixture = `
    [aria-hidden i],
    [ARIA-HIDDEN="false" I],
    [ROLE="tablist" s],
    [ROLE="tablist" S] {}
  `
	const actual = analyze(fixture).selectors.accessibility
	const expected = {
		total: 4,
		totalUnique: 3,
		unique: {
			'[aria-hidden]': 1,
			'[aria-hidden="false"]': 1,
			'[role="tablist"]': 2,
		},
		uniquenessRatio: 3 / 4,
		ratio: 4 / 4,
	}

	expect(actual).toEqual(expected)
})

test('normalizes attribute name', () => {
	const fixture = `
    [ARIA-HIDDEN],
    img[ROLE="presentation"],
    img[ROLE="PRESENTATION"],
    .selector:not([ROLE="tablist"]),
		body.intent-mouse [role=tabpanel][tabindex="0"]:focus {}
  `
	const actual = analyze(fixture).selectors.accessibility
	const expected = {
		total: 5,
		totalUnique: 5,
		unique: {
			'[aria-hidden]': 1,
			'[role="presentation"]': 1,
			'[role="PRESENTATION"]': 1, // makes a difference for CSS, but not for accessibility tree
			'[role="tablist"]': 1,
			'[role="tabpanel"]': 1,
		},
		uniquenessRatio: 5 / 5,
		ratio: 5 / 5,
	}

	expect(actual).toEqual(expected)
})

test('does not report false positives', () => {
	const fixture = `
    img[loading="lazy"],
    [hidden] {}
  `
	const actual = analyze(fixture).selectors.accessibility
	expect(actual.total).toEqual(0)
	expect(actual.unique).toEqual({})
})
