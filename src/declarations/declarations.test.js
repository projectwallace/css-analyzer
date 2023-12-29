import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { analyze } from '../index.js'

const Declarations = suite('Declarations')

Declarations('handles empty values', () => {
  let css = `
    thing {
      height:;
      width: ;
    }
  `

  assert.not.throws(() => analyze(css))
})

Declarations('should be counted', () => {
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

  assert.is(actual.total, 6)
  assert.is(actual.unique.total, 5)
  assert.is(actual.unique.ratio, 5 / 6)
})

Declarations('should count !importants', () => {
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
      ratio: 0
    }
  }

  assert.equal(actual, expected)
})

/**
 * @see https://drafts.csswg.org/css-animations-1/#keyframes
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/@keyframes#!important_in_a_keyframe
 */
Declarations('should calculate !importants within @keyframes', () => {
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

  assert.is(actual.total, 2)
  assert.equal(actual.inKeyframes, {
    total: 1,
    ratio: 1 / 2
  })
})

Declarations('should count complexity', () => {
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
    median: 2,
    range: 2,
    sum: 6,
  }
  assert.equal(actual, expected)
})

Declarations.run()