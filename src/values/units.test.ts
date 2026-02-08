import { test } from 'vitest'
import { expect } from 'vitest'
import { analyze } from '../index.js'

test('analyzes length units', () => {
	const fixture = `
    test {
      font: normal 10px/11px Arial;
      font: 14px sans-serif;
    }

    @media (min-width: 10em) {
      test2 {
        width: 12vw;
        height: 13vmin;
      }
    }

    @supports (hover: hover) {
      @media all {
        @media screen and (max-width: 100px) {
          line-height: 2;
        }
      }
    }
  `
	const result = analyze(fixture)
	const actual = result.values.units

	const expected = {
		total: 5,
		totalUnique: 3,
		uniquenessRatio: 3 / 5,
		unique: {
			px: 3,
			vw: 1,
			vmin: 1,
		},
		itemsPerContext: {
			font: {
				total: 3,
				totalUnique: 1,
				uniquenessRatio: 1 / 3,
				unique: {
					px: 3,
				},
			},
			width: {
				total: 1,
				totalUnique: 1,
				uniquenessRatio: 1,
				unique: {
					vw: 1,
				},
			},
			height: {
				total: 1,
				totalUnique: 1,
				uniquenessRatio: 1,
				unique: {
					vmin: 1,
				},
			},
		},
	}

	expect(actual).toEqual(expected)
})

test('normalizes units', () => {
	let actual = analyze(`
    a {
      font-size: 10px;
      width: 24PX;
    }
  `).values.units

	expect(actual.unique).toEqual({
		px: 2,
	})
	expect(actual.total).toBe(2)
	expect(actual.totalUnique).toBe(1)
})

test('should not include browserhacks', () => {
	let actual = analyze(`
    a {
      font-size: 10px\\9;
      color: 1em!ie;
    }
  `).values.units

	expect(actual.unique).toEqual({
		px: 1,
		em: 1,
	})
	expect(actual.total).toBe(2)
	expect(actual.totalUnique).toBe(2)
})
