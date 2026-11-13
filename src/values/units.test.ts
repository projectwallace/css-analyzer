import { test, expect } from 'vitest'
import { analyze } from '../index.ts'

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
	const actual = analyze(`
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
	const actual = analyze(`
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

test.each([
	['transition: opacity 300ms ease', 'ms'],
	['animation: spin 2s linear infinite', 's'],
	['transition: opacity 1s ease 150ms', 'ms'],
	['animation: spin 2s linear 500ms infinite', 'ms'],
	['font: 14px/1.5 sans-serif', 'px'],
	['font: 1.2em/20px Arial', 'em'],
	['margin: 1px 2rem', 'rem'],
	['border: 1px solid red', 'px'],
	['padding: 0 10vw', 'vw'],
	['box-shadow: 0 0 4px 2px red', 'px'],
	['text-shadow: 1px 1px 2px red', 'px'],
	['border-radius: 4px 8%', 'px'],
	['grid-template-columns: 1fr 2fr', 'fr'],
	['flex: 1 1 10%', '%'],
	['background: url(a.png) 10px 20px', 'px'],
	['transform: rotate(45deg)', 'deg'],
])('counts units in shorthand `%s`', (declaration, unit) => {
	const result = analyze(`a { ${declaration} }`)
	expect(result.values.units.unique[unit]).toBeGreaterThan(0)
})
