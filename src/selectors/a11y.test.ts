import { test, expect } from 'vitest'
import { analyze } from '../index.js'

test('counts Accessibility selectors', () => {
	const fixture = `
    [aria-hidden],
    img[role="presentation"],
    .selector:not([role="tablist"]),
    body.intent-mouse·[role=tabpanel][tabindex="0"]:focus,
    img[loading="lazy"],
    [hidden] {}

    /* Note: img[loading="lazy"] and [hidden] are false positives for accessibility */
  `
	const actual = analyze(fixture).selectors.accessibility
	const expected = {
		total: 4,
		totalUnique: 4,
		unique: {
			'[aria-hidden]': 1,
			'img[role="presentation"]': 1,
			'.selector:not([role="tablist"])': 1,
			'body.intent-mouse·[role=tabpanel][tabindex="0"]:focus': 1,
		},
		uniquenessRatio: 1 / 1,
		ratio: 4 / 6,
	}

	expect(actual).toEqual(expected)
})
