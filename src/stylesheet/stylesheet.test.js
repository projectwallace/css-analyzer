import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { analyze } from '../index.js'

const Stylesheet = suite('Stylesheet')

Stylesheet('counts Lines of Code', () => {
  const fixture = `
    /* doc */

    html {
      nothing: here;
    }

    @done {

    }
  `
  const actual = analyze(fixture).stylesheet.linesOfCode
  assert.is(actual, 11)
})

Stylesheet('counts Source Lines of Code', () => {
  const fixture = `
    rule {
      color: green;
      color: orange !important;
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
  const actual = analyze(fixture).stylesheet.sourceLinesOfCode
  assert.is(actual, 13)
})

Stylesheet('calculates filesize', () => {
  const fixture = `test {}`
  const actual = analyze(fixture).stylesheet.size
  assert.is(actual, 7)
})

Stylesheet('counts comments', () => {
  const fixture = `
    /* comment 1 */
    test1,
    /* comment 2 */
    test2 {
      /* comment 3 */
      color: /* comment 4 */ green;
      background:
        red,
        /* comment 5 */
        yellow
      ;
    }

    @media all {
      /* comment 6 */
    }
  `
  const result = analyze(fixture)
  const actual = result.stylesheet.comments
  const expected = {
    total: 6,
    size: 66,
  }

  assert.equal(actual, expected)
})

Stylesheet.run()