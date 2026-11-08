import { test, expect } from 'vitest'
import { analyze } from '../engine/analyzer.js'
import { series } from '../test-utils.js'
import { summarize_numbers } from '../engine/summary.js'
import { declarations } from './declarations.js'

/** Declaration results with the shape the old tests were written for */
function run(css: string) {
	const { result } = analyze(css, { result: declarations({ sequence: true }) })
	const { min, max, mean, mode, range, sum } = summarize_numbers(result.complexity)
	return {
		total: result.total,
		total_unique: result.total_unique,
		importants: {
			total: result.importants.total,
			in_keyframes: { total: result.importants.in_keyframes },
		},
		complexity: { min, max, mean, mode, range, sum },
		nesting: series(result.nesting),
	}
}

test('handles empty values', () => {
	const css = `
    thing {
      height:;
      width: ;
    }
  `

	expect(() => run(css)).not.toThrowError()
})

test('should be counted', () => {
	const fixture = `
    rule {
      color: green;
      color: orange !important;
    }

    rule2 {
      color: green; /* not unique */
    }

    @media print {
      @media (min-width: 1000px) {
        @supports (display: grid) {
          @keyframes test {
            from {
              opacity: 1;
            }
            to {
              opacity: 0;
            }
          }

          another-rule {
            color: purple;
          }
        }
      }
    }
  `
	const actual = run(fixture)

	expect(actual.total).toEqual(6)
	expect(actual.total_unique).toEqual(5)
})

test('should count !importants', () => {
	const fixture = `
    some {
      color: red;
      color: red: !important;
    }

    @media (min-width: 0) {
      nested {
        color: darkred;
        color: darkred !important;
      }
    }

    @supports (color: rebeccapurple) {
      nested-too {
        color: rebeccapurple;
        color: rebeccapurple !important;
      }
    }

    @media print {
      @media (max-width: 0) {
        @page {
          color: black;
          color: black !important;
        }
      }
    }
  `
	const actual = run(fixture).importants
	const expected = {
		total: 4,
		in_keyframes: {
			total: 0,
		},
	}

	expect(actual).toEqual(expected)
})

/**
 * @see https://drafts.csswg.org/css-animations-1/#keyframes
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/@keyframes#!important_in_a_keyframe
 */
test('should calculate !importants within @keyframes', () => {
	const fixture = `
    test1 {
      color: green !important;
    }

    @keyframes myTest {
      from {
        opacity: 1 !important;
      }
    }
  `
	const result = run(fixture)
	const actual = result.importants

	expect(actual.total).toEqual(2)
	expect(actual.in_keyframes).toEqual({
		total: 1,
	})
})

test('should count complexity', () => {
	const css = `
    a {
      color: green;
      color: green !important;
    }

    @keyframes test {
      from {
        opacity: 1 !important;
      }
    }
  `
	const actual = run(css).complexity
	const expected = {
		min: 1,
		max: 3,
		mean: 2,
		mode: 2,
		range: 2,
		sum: 6,
	}
	expect(actual).toEqual(expected)
})

test('tracks nesting depth', () => {
	const fixture = `
    a {
      color: red;
    }

    b {
      color: green;

      &:hover {
        color: blue;
      }

      color: deepskyblue;

      @container (width > 400px) {
        color: rebeccapurple
      }
    }

    @media print {
      @supports (display: grid) {
        c {
          color: orange;
        }
      }
    }
  `
	const actual = run(fixture).nesting
	const expected = {
		min: 0,
		max: 2,
		mean: 0.6666666666666666,
		mode: 0,
		range: 2,
		sum: 4,
		items: [0, 0, 1, 0, 1, 2],
		total: 6,
		total_unique: 3,
		unique: {
			0: 3,
			1: 2,
			2: 1,
		},
	}
	expect(actual).toEqual(expected)
})
