import { test, expect } from 'vitest'
import { analyze } from '../engine/analyzer.ts'
import { plain } from '../test-utils.ts'
import { text_shadows } from './values.ts'

function run(css: string) {
	return plain(analyze(css, { result: text_shadows() }).result)
}

test('finds simple values', () => {
	const fixture = `
    text-shadows-simple {
      text-shadow: 1px 1px 2px black;
      text-shadow: #fc0 1px 0 10px;
      text-shadow: 5px 5px #558abb;
      text-shadow: white 2px 5px;
      text-shadow: 5px 10px;
      text-shadow: red 0 -2px;
    }
  `
	const actual = run(fixture)
	const expected = {
		total: 6,
		unique: {
			'1px 1px 2px black': 1,
			'#fc0 1px 0 10px': 1,
			'5px 5px #558abb': 1,
			'white 2px 5px': 1,
			'5px 10px': 1,
			'red 0 -2px': 1,
		},
		total_unique: 6,
	}

	expect(actual).toEqual(expected)
})

test('finds complex values', () => {
	const fixture = `
    text-shadows-complex {
      text-shadow: 1px 1px 2px black, 0 0 1em blue, 0 0 0.2em blue;
    }
  `
	const actual = run(fixture)
	const expected = {
		total: 1,
		unique: {
			'1px 1px 2px black, 0 0 1em blue, 0 0 0.2em blue': 1,
		},
		total_unique: 1,
	}

	expect(actual).toEqual(expected)
})

test('finds vendor prefixed values', () => {
	const fixture = `
    text-shadows-vendor-prefixed {
      -webkit-text-shadow: 1px 1px 2px black;
    }
  `
	const actual = run(fixture)
	const expected = {
		total: 1,
		unique: {
			'1px 1px 2px black': 1,
		},
		total_unique: 1,
	}

	expect(actual).toEqual(expected)
})

test('ignores keywords', () => {
	const fixture = `
    text-shadows-keyword {
      text-shadow: none;

      /* Global values */
      text-shadow: inherit;
      text-shadow: initial;
      text-shadow: revert;
      text-shadow: revert-layer;
      text-shadow: unset;
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
