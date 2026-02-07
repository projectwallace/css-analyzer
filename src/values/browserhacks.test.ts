import { test } from 'vitest'
import { expect } from 'vitest'
import { analyze } from '../index.js'

test('finds hacks', () => {
	const fixture = `
    value-browserhacks {
      property: value !ie;
      property: value !test;
      property: value!nospace;
      property: value\\9;
    }
  `
	const actual = analyze(fixture).values.browserhacks
	const expected = {
		total: 4,
		totalUnique: 4,
		unique: {
			'value !ie': 1,
			'value !test': 1,
			'value!nospace': 1,
			'value\\9': 1,
		},
		uniquenessRatio: 4 / 4,
	}
	expect(actual).toEqual(expected)
})

test('reports no false positives', () => {
	const fixture = `
    value-browserhacks {
      property: value !important;
      content: '!important';
      margin: 0 !IMPORTANT;
      margin: 0 !important;
      aspect-ratio: 16/9;
    }
  `
	const actual = analyze(fixture).values.browserhacks
	const expected = {
		total: 0,
		totalUnique: 0,
		unique: {},
		uniquenessRatio: 0,
	}
	expect(actual).toEqual(expected)
})
