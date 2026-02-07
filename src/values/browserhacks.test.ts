import { test } from 'vitest'
import { expect } from 'vitest'
import { analyze } from '../index.js'

test('finds hacks', () => {
	const fixture = `
    value-browserhacks {
      property: value !ie;
      property: value !IE;
      property: value !test;
      property: value!nospace;
      property: value\\9;
    }
  `
	const actual = analyze(fixture).values.browserhacks
	const expected = {
		total: 5,
		totalUnique: 2,
		unique: {
			'!ie': 4,
			'\\9': 1,
		},
		uniquenessRatio: 2 / 5,
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
