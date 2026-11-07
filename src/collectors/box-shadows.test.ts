import { test, expect } from 'vitest'
import { analyze } from '../engine/analyzer.js'
import { plain } from '../test-utils.js'
import { box_shadows } from './box-shadows.js'

function run(css: string) {
	return plain(analyze(css, { result: box_shadows() }).result)
}

test('finds simple values', () => {
	const fixture = `
    box-shadows-simple {
      box-shadow: 1px 1px 2px black;
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

test('finds complex values', () => {
	const fixture = `
    box-shadows-complex {
      box-shadow: 1px 1px 1px black,inset 2px 3px 5px rgba(0,0,0,0.3),inset -2px -3px 5px rgba(255,255,255,0.5);
    }
  `
	const actual = run(fixture)
	const expected = {
		total: 1,
		unique: {
			'1px 1px 1px black,inset 2px 3px 5px rgba(0,0,0,0.3),inset -2px -3px 5px rgba(255,255,255,0.5)': 1,
		},
		total_unique: 1,
	}

	expect(actual).toEqual(expected)
})

test('finds vendor prefixed values', () => {
	const fixture = `
    box-shadows-vendor-prefixed {
      -webkit-box-shadow: 1px 1px 2px black;
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

test('does not report var() fallback values as separate values', () => {
	const fixture = `
    with-fallback {
      box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
  }`
	const actual = run(fixture)
	const expected = {
		total: 1,
		unique: {
			'var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)': 1,
		},
		total_unique: 1,
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
