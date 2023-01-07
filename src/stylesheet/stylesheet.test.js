import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { analyze } from '../index.js'
import { getEmbedType } from './stylesheet.js'

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

Stylesheet('measures base64 contents', () => {
  const fixture = `
    /* Demo from https://css-tricks.com/data-uris/ */
    li {
      background:
        url(data:image/gif;base64,R0lGODlhEAAQAMQAAORHHOVSKudfOulrSOp3WOyDZu6QdvCchPGolfO0o/XBs/fNwfjZ0frl3/zy7////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAkAABAALAAAAAAQABAAAAVVICSOZGlCQAosJ6mu7fiyZeKqNKToQGDsM8hBADgUXoGAiqhSvp5QAnQKGIgUhwFUYLCVDFCrKUE1lBavAViFIDlTImbKC5Gm2hB0SlBCBMQiB0UjIQA7)
        no-repeat
        left center;
      padding: 5px 0 5px 25px;
    }

    /* Demo from https://codepen.io/chriscoyier/pen/ZQgvyG/ */
    .chevron-down {
      background: url(data:image/svg+xml,%3Csvg%20id%3D%22Layer_1%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20195.6%20107.8%22%3E%3Cpath%20fill%3D%22%23B5B5B5%22%20class%3D%22st0%22%20d%3D%22M97.8%20107.8c-2.6%200-5.1-1-7.1-2.9L2.9%2017.1C-1%2013.2-1%206.8%202.9%202.9%206.8-1%2013.2-1%2017.1%202.9l80.7%2080.7%2080.7-80.7c3.9-3.9%2010.2-3.9%2014.1%200%203.9%203.9%203.9%2010.2%200%2014.1l-87.8%2087.8c-1.9%202-4.4%203-7%203z%22%2F%3E%3C%2Fsvg%3E);
      background: url(data:image/svg+xml;base64,PHN2ZyBpZD0iTGF5ZXJfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMTk1LjYgMTA3LjgiPjxwYXRoIGZpbGw9IiNCNUI1QjUiIGNsYXNzPSJzdDAiIGQ9Ik05Ny44IDEwNy44Yy0yLjYgMC01LjEtMS03LjEtMi45TDIuOSAxNy4xQy0xIDEzLjItMSA2LjggMi45IDIuOSA2LjgtMSAxMy4yLTEgMTcuMSAyLjlsODAuNyA4MC43IDgwLjctODAuN2MzLjktMy45IDEwLjItMy45IDE0LjEgMCAzLjkgMy45IDMuOSAxMC4yIDAgMTQuMWwtODcuOCA4Ny44Yy0xLjkgMi00LjQgMy03IDN6Ii8+PC9zdmc+);
    }
  `

  const actual = analyze(fixture).stylesheet.embeddedContent
  const expected = {
    total: 3,
    totalUnique: 3,
    unique: {
      'data:image/gif;base64,R0lGODlhEAAQAMQAAORHHOVSKudfOulrSOp3WOyDZu6QdvCchPGolfO0o/XBs/fNwfjZ0frl3/zy7////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAkAABAALAAAAAAQABAAAAVVICSOZGlCQAosJ6mu7fiyZeKqNKToQGDsM8hBADgUXoGAiqhSvp5QAnQKGIgUhwFUYLCVDFCrKUE1lBavAViFIDlTImbKC5Gm2hB0SlBCBMQiB0UjIQA7': 1,
      'data:image/svg+xml,%3Csvg%20id%3D%22Layer_1%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20195.6%20107.8%22%3E%3Cpath%20fill%3D%22%23B5B5B5%22%20class%3D%22st0%22%20d%3D%22M97.8%20107.8c-2.6%200-5.1-1-7.1-2.9L2.9%2017.1C-1%2013.2-1%206.8%202.9%202.9%206.8-1%2013.2-1%2017.1%202.9l80.7%2080.7%2080.7-80.7c3.9-3.9%2010.2-3.9%2014.1%200%203.9%203.9%203.9%2010.2%200%2014.1l-87.8%2087.8c-1.9%202-4.4%203-7%203z%22%2F%3E%3C%2Fsvg%3E': 1,
      'data:image/svg+xml;base64,PHN2ZyBpZD0iTGF5ZXJfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMTk1LjYgMTA3LjgiPjxwYXRoIGZpbGw9IiNCNUI1QjUiIGNsYXNzPSJzdDAiIGQ9Ik05Ny44IDEwNy44Yy0yLjYgMC01LjEtMS03LjEtMi45TDIuOSAxNy4xQy0xIDEzLjItMSA2LjggMi45IDIuOSA2LjgtMSAxMy4yLTEgMTcuMSAyLjlsODAuNyA4MC43IDgwLjctODAuN2MzLjktMy45IDEwLjItMy45IDE0LjEgMCAzLjkgMy45IDMuOSAxMC4yIDAgMTQuMWwtODcuOCA4Ny44Yy0xLjkgMi00LjQgMy03IDN6Ii8+PC9zdmc+': 1,
    },
    uniquenessRatio: 3 / 3,
    size: {
      total: 1203,
      ratio: 0.7930125247198417,
    },
    types: {
      total: 3,
      totalUnique: 2,
      uniquenessRatio: 2 / 3,
      unique: {
        'image/gif': {
          count: 1,
          size: 310,
        },
        'image/svg+xml': {
          count: 2,
          size: 459 + 434,
        },
      },
    }
  }

  assert.equal(actual, expected)
})

Stylesheet('reports embed size correctly when there are duplicates', () => {
  const fixture = `
    /* Demo from https://codepen.io/chriscoyier/pen/ZQgvyG/ */
    .chevron-down {
      background: url(data:image/svg+xml,%3Csvg%20id%3D%22Layer_1%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20195.6%20107.8%22%3E%3Cpath%20fill%3D%22%23B5B5B5%22%20class%3D%22st0%22%20d%3D%22M97.8%20107.8c-2.6%200-5.1-1-7.1-2.9L2.9%2017.1C-1%2013.2-1%206.8%202.9%202.9%206.8-1%2013.2-1%2017.1%202.9l80.7%2080.7%2080.7-80.7c3.9-3.9%2010.2-3.9%2014.1%200%203.9%203.9%203.9%2010.2%200%2014.1l-87.8%2087.8c-1.9%202-4.4%203-7%203z%22%2F%3E%3C%2Fsvg%3E);
    }
    .chevron-up {
      background: url(data:image/svg+xml,%3Csvg%20id%3D%22Layer_1%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20195.6%20107.8%22%3E%3Cpath%20fill%3D%22%23B5B5B5%22%20class%3D%22st0%22%20d%3D%22M97.8%20107.8c-2.6%200-5.1-1-7.1-2.9L2.9%2017.1C-1%2013.2-1%206.8%202.9%202.9%206.8-1%2013.2-1%2017.1%202.9l80.7%2080.7%2080.7-80.7c3.9-3.9%2010.2-3.9%2014.1%200%203.9%203.9%203.9%2010.2%200%2014.1l-87.8%2087.8c-1.9%202-4.4%203-7%203z%22%2F%3E%3C%2Fsvg%3E);
      transform: rotate(.5turn);
    }
  `

  const actual = analyze(fixture).stylesheet.embeddedContent
  const expected = {
    total: 2,
    totalUnique: 1,
    unique: {
      // .length == 459
      'data:image/svg+xml,%3Csvg%20id%3D%22Layer_1%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20195.6%20107.8%22%3E%3Cpath%20fill%3D%22%23B5B5B5%22%20class%3D%22st0%22%20d%3D%22M97.8%20107.8c-2.6%200-5.1-1-7.1-2.9L2.9%2017.1C-1%2013.2-1%206.8%202.9%202.9%206.8-1%2013.2-1%2017.1%202.9l80.7%2080.7%2080.7-80.7c3.9-3.9%2010.2-3.9%2014.1%200%203.9%203.9%203.9%2010.2%200%2014.1l-87.8%2087.8c-1.9%202-4.4%203-7%203z%22%2F%3E%3C%2Fsvg%3E': 2,
    },
    uniquenessRatio: 1 / 2,
    size: {
      total: 918,
      ratio: 0.8218442256042973,
    },
    types: {
      total: 2,
      totalUnique: 1,
      uniquenessRatio: 1 / 2,
      unique: {
        'image/svg+xml': {
          count: 2,
          size: 918,
        },
      },
    }
  }

  assert.equal(actual, expected)
})

Stylesheet('correctly extracts embed types', () => {
  ;[
    ['test', 'data:test;nothing-to-see-here'],
    ['image/gif', 'data:image/gif;base64,R0lGODlhEAAQAMQAAORHHOVS'],
    ['image/svg+xml', 'data:image/svg+xml,%3Csvg%20id%3D%22Layer_'],
    ['image/svg+xml', 'data:image/svg+xml;base64,PHN2ZyBpZD0iTGF5'],
    ['application/font-woff', 'data:application/font-woff;base64,d09GRgAB'],
    ['font/opentype', 'data:font/opentype;base64,T1RUTwAJAIAAAw'],
    ['image/png', 'data:image/png;base64,iVBORw0KGgoAAAANS'],
    ['image/svg+xml', `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28.84 26.6'%3E%3Cdefs%3E%3Cstyle%3E.cls-1%7Bfill:%23e93e32;%7D%3C/style%3E%3C/defs%3E%3Ctitle%3EArtboard 29%3C/title%3E%3Cpath class='cls-1' d='M3.29,2.73a66.7,66.7,0,0,0,3.21,9.52l6.29,1.08L8.1,15.53c2.91,5.28,7,9.09,12.14,4.55L25,24.52l.57-.52-3.83-5.48c3.6-4.32,1.74-7.76-1.93-10.36L17,13.29l-.1-6.85A43.83,43.83,0,0,0,11,4L9,7.7,9,3.39c-2.2-.65-4.07-1.08-5.08-1.3A.52.52,0,0,0,3.29,2.73Z'/%3E%3C/svg%3E`]
  ].forEach(([expected, fixture]) => {
    assert.is(getEmbedType(fixture), expected)
  })
})

Stylesheet.run()