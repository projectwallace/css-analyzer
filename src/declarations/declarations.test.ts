import { test, expect } from 'vitest'
import { analyze } from '../index.js'

test('handles empty values', () => {
	let css = `
    thing {
      height:;
      width: ;
    }
  `

	expect(() => analyze(css)).not.toThrowError()
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
	const actual = analyze(fixture).declarations

	expect(actual.total).toEqual(6)
	expect(actual.totalUnique).toEqual(5)
	expect(actual.uniquenessRatio).toEqual(5 / 6)
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
	const actual = analyze(fixture).declarations.importants
	const expected = {
		total: 4,
		ratio: 0.5,
		inKeyframes: {
			total: 0,
			ratio: 0,
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
	const result = analyze(fixture)
	const actual = result.declarations.importants

	expect(actual.total).toEqual(2)
	expect(actual.inKeyframes).toEqual({
		total: 1,
		ratio: 1 / 2,
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
	const actual = analyze(css).declarations.complexity
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
	const actual = analyze(fixture, { samples: true }).declarations.nesting
	const expected = {
		min: 0,
		max: 2,
		mean: 0.6666666666666666,
		mode: 0,
		range: 2,
		sum: 4,
		items: [0, 0, 1, 0, 1, 2],
		total: 6,
		totalUnique: 3,
		unique: {
			0: 3,
			1: 2,
			2: 1,
		},
		uniquenessRatio: 3 / 6,
	}
	expect(actual).toEqual(expected)
})
