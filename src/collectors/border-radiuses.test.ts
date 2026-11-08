import { test, expect } from 'vitest'
import { analyze } from '../engine/analyzer.ts'
import { plain } from '../test-utils.ts'
import { border_radiuses } from './border-radiuses.ts'

function run(css: string) {
	return plain(
		analyze(css, { result: border_radiuses({ contexts: true, property: 'as_written' }) }).result,
	)
}

test('finds simple values', () => {
	const fixture = `
    radius {
			/* Examples from https://developer.mozilla.org/en-US/docs/Web/CSS/border-radius */

			/* The syntax of the first radius allows one to four values */
			/* Radius is set for all 4 sides */
			border-radius: 10px;

			/* top-left-and-bottom-right | top-right-and-bottom-left */
			border-radius: 10px 5%;

			/* top-left | top-right-and-bottom-left | bottom-right */
			border-radius: 2px 4px 2px;

			/* top-left | top-right | bottom-right | bottom-left */
			border-radius: 1px 0 3px 4px;

			/* The syntax of the second radius allows one to four values */
			/* (first radius values) / radius */
			border-radius: 10px / 20px;

			/* (first radius values) / top-left-and-bottom-right | top-right-and-bottom-left */
			border-radius: 10px 5% / 20px 30px;

			/* (first radius values) / top-left | top-right-and-bottom-left | bottom-right */
			border-radius: 10px 5px 2em / 20px 25px 30%;

			/* (first radius values) / top-left | top-right | bottom-right | bottom-left */
			border-radius: 10px 5% / 20px 25em 30px 35em;
    }
  `
	const actual = run(fixture)
	const expected = {
		total: 8,
		unique: {
			'10px': 1,
			'10px 5%': 1,
			'2px 4px 2px': 1,
			'1px 0 3px 4px': 1,
			'10px / 20px': 1,
			'10px 5% / 20px 30px': 1,
			'10px 5px 2em / 20px 25px 30%': 1,
			'10px 5% / 20px 25em 30px 35em': 1,
		},
		total_unique: 8,
		by_context: {
			'border-radius': {
				total: 8,
				total_unique: 8,
				unique: {
					'10px': 1,
					'10px 5%': 1,
					'2px 4px 2px': 1,
					'1px 0 3px 4px': 1,
					'10px / 20px': 1,
					'10px 5% / 20px 30px': 1,
					'10px 5px 2em / 20px 25px 30%': 1,
					'10px 5% / 20px 25em 30px 35em': 1,
				},
			},
		},
	}

	expect(actual).toEqual(expected)
})

test('finds vendor prefixed values', () => {
	const fixture = `
    radius-vendor-prefixed {
      -moz-border-radius: 10px / 20px;
			-webkit-border-top-right-radius: 10px;
    }
  `
	const actual = run(fixture)
	const expected = {
		total: 2,
		unique: {
			'10px / 20px': 1,
			'10px': 1,
		},
		total_unique: 2,
		by_context: {
			'-moz-border-radius': {
				total: 1,
				total_unique: 1,
				unique: {
					'10px / 20px': 1,
				},
			},
			'-webkit-border-top-right-radius': {
				total: 1,
				total_unique: 1,
				unique: {
					'10px': 1,
				},
			},
		},
	}

	expect(actual).toEqual(expected)
})

test('finds non-shorthands, logical properties', () => {
	const fixture = `
	.radius {
		border-start-start-radius: 1em 5em;
		border-start-end-radius: 1em 5em;
		border-end-end-radius: 1em 5em;
		border-end-start-radius: 1em 5em;
	}
	`
	const actual = run(fixture)
	const expected = {
		total: 4,
		unique: {
			'1em 5em': 4,
		},
		total_unique: 1,
		by_context: {
			'border-start-start-radius': {
				total: 1,
				total_unique: 1,
				unique: {
					'1em 5em': 1,
				},
			},
			'border-start-end-radius': {
				total: 1,
				total_unique: 1,
				unique: {
					'1em 5em': 1,
				},
			},
			'border-end-end-radius': {
				total: 1,
				total_unique: 1,
				unique: {
					'1em 5em': 1,
				},
			},
			'border-end-start-radius': {
				total: 1,
				total_unique: 1,
				unique: {
					'1em 5em': 1,
				},
			},
		},
	}

	expect(actual).toEqual(expected)
})

test('finds non-shorthands, non-logical properties', () => {
	const fixture = `
	.radius {
		border-top-left-radius: 1em 5em;
		border-top-right-radius: 1em 5em;
		border-bottom-right-radius: 1em 5em;
		border-bottom-left-radius: 1em 5em;
	}
	`
	const actual = run(fixture)
	const expected = {
		total: 4,
		unique: {
			'1em 5em': 4,
		},
		total_unique: 1,
		by_context: {
			'border-top-left-radius': {
				total: 1,
				total_unique: 1,
				unique: {
					'1em 5em': 1,
				},
			},
			'border-top-right-radius': {
				total: 1,
				total_unique: 1,
				unique: {
					'1em 5em': 1,
				},
			},
			'border-bottom-left-radius': {
				total: 1,
				total_unique: 1,
				unique: {
					'1em 5em': 1,
				},
			},
			'border-bottom-right-radius': {
				total: 1,
				total_unique: 1,
				unique: {
					'1em 5em': 1,
				},
			},
		},
	}

	expect(actual).toEqual(expected)
})

test('ignores keywords', () => {
	const fixture = `
    box-shadows-keyword {
      box-shadow: none;

      /* Global keywords */
      box-shadow: initial;
      box-shadow: inherit;
      box-shadow: revert;
      box-shadow: revert-layer;
      box-shadow: unset;
    }
  `
	const actual = run(fixture)
	const expected = {
		total: 0,
		unique: {},
		total_unique: 0,
	}

	expect(actual).toEqual(expected)
})
