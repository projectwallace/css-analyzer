import { test, expect } from 'vitest'
import { analyze } from '../engine/analyzer.ts'
import { plain } from '../test/test-utils.ts'
import { units } from './units.ts'

function run(css: string) {
	return plain(analyze(css, { result: units({ contexts: true, property: 'as_written' }) }).result)
}

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
	const result = run(fixture)
	const actual = result

	const expected = {
		total: 5,
		total_unique: 3,
		unique: {
			px: 3,
			vw: 1,
			vmin: 1,
		},
		by_context: {
			font: {
				total: 3,
				total_unique: 1,
				unique: {
					px: 3,
				},
			},
			width: {
				total: 1,
				total_unique: 1,
				unique: {
					vw: 1,
				},
			},
			height: {
				total: 1,
				total_unique: 1,
				unique: {
					vmin: 1,
				},
			},
		},
	}

	expect(actual).toEqual(expected)
})

test('normalizes units', () => {
	const actual = run(`
    a {
      font-size: 10px;
      width: 24PX;
    }
  `)

	expect(actual.unique).toEqual({
		px: 2,
	})
	expect(actual.total).toBe(2)
	expect(actual.total_unique).toBe(1)
})

test('should not include browserhacks', () => {
	const actual = run(`
    a {
      font-size: 10px\\9;
      color: 1em!ie;
    }
  `)

	expect(actual.unique).toEqual({
		px: 1,
		em: 1,
	})
	expect(actual.total).toBe(2)
	expect(actual.total_unique).toBe(2)
})

test('counts the units of durations: they are units, not lengths', () => {
	const result = analyze(
		`a {
			transition: opacity 200ms ease, color 1s;
			animation: spin 2s linear 100ms;
			animation-duration: 3S;
			transition-delay: 50ms;
		}`,
		{ result: units({ contexts: true }) },
	).result
	expect(plain(result).unique).toEqual({ ms: 3, s: 3 })
	expect([...result.by_context.keys()]).toEqual([
		'transition',
		'animation',
		'animation-duration',
		'transition-delay',
	])
})
