import { test, expect } from 'vitest'
import { analyze } from '../engine/analyzer.js'
import { stylesheet } from '../collectors/stylesheet.js'

/** Stylesheet results with the shape the old tests were written for */
function run(css: string) {
	const { result } = analyze(css, { result: stylesheet() })
	return {
		size: result.size,
		lines: result.lines,
		comments: result.comments,
		embedded: {
			total: result.embedded.total,
			size: result.embedded.size,
			types: Object.fromEntries(
				[...result.embedded.types].map(([type, { count, size }]) => [type, { count, size }]),
			),
		},
	}
}

test('counts Lines of Code', () => {
	const fixture = `
    /* doc */

    html {
      nothing: here;
    }

    @done {

    }
  `
	const actual = run(fixture).lines
	expect(actual).toBe(11)
})

test('calculates filesize', () => {
	const fixture = `test {}`
	const actual = run(fixture).size
	expect(actual).toBe(7)
})

test('counts comments', () => {
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
	const actual = run(fixture).comments
	const expected = {
		total: 6,
		size: 90, // includes the /* and */ symbols
	}

	expect(actual).toEqual(expected)
})

test('measures base64 contents', () => {
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

    /* Demo from smashingmagazine.com */
    .thing {
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28.84 26.6'%3E%3Cdefs%3E%3Cstyle%3E.cls-1%7Bfill:%23e93e32%7D%3C/style%3E%3C/defs%3E%3Crect class='cls-1' x='8.25' y='2.31' width='3.06' height='3.66' rx='1.03' ry='1.03'/%3E%3Crect class='cls-1' x='17.53' y='2.31' width='3.06' height='3.66' rx='1.03' ry='1.03'/%3E%3Cpath class='cls-1' d='M24.1 5.39h-2.56a2 2 0 01-2 1.59h-1a2 2 0 01-2-1.59h-4.28a2 2 0 01-2 1.59h-1a2 2 0 01-2-1.59H4.75a2.07 2.07 0 00-2.08 2.07v14.75a2.07 2.07 0 002.07 2.07H24.1a2.07 2.07 0 002.07-2.07V7.46a2.07 2.07 0 00-2.07-2.07zm-.29 16.15H5.23V8.45h18.58z'/%3E%3Cpath class='cls-1' d='M7.18 11.71h2.5v2.5h-2.5zM11.27 11.71h2.5v2.5h-2.5zM15.26 11.71h2.5v2.5h-2.5zM19.35 11.71h2.5v2.5h-2.5zM7.18 15.78h2.5v2.5h-2.5zM11.27 15.78h2.5v2.5h-2.5zM15.26 15.78h2.5v2.5h-2.5zM19.35 15.78h2.5v2.5h-2.5z'/%3E%3C/svg%3E");
    }

    /* Stackoverflow.com */
    .thing {
      --_ba-before-icon: url("data:image/svg+xml,%3Csvg width='9' height='11' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3.55.246c.257-.329.647-.327.903 0l3.36 4.66c.256.329.256.864 0 1.192L4.45 10.75c-.257.329-.644.327-.9 0L.192 6.098c-.256-.329-.256-.865 0-1.192L3.55.246z' fill='%23fff'/%3E%3C/svg%3E");
    }
  `

	const actual = run(fixture).embedded
	const expected = {
		total: 5,
		size: 2337,
		types: {
			'image/gif': { count: 1, size: 310 },
			'image/svg+xml': { count: 4, size: 2027 },
		},
	}

	expect(actual).toEqual(expected)
})

test('reports embed size correctly when there are duplicates', () => {
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

	const actual = run(fixture).embedded
	const expected = {
		total: 2,
		size: 918,
		types: {
			'image/svg+xml': { count: 2, size: 918 },
		},
	}

	expect(actual).toEqual(expected)
})
