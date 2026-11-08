import { test, expect } from 'vitest'
import { analyze } from '../engine/analyzer.ts'
import { plain } from '../test-utils.ts'
import { z_indexes } from './z-indexes.ts'

function run(css: string) {
	return plain(analyze(css, { result: z_indexes() }).result)
}

test('finds simple values', () => {
	const fixture = `
    test {
      z-index: 1;
      z-index: 0;
      z-index: -1;
      z-index: 99999;
      z-index: -100;
      z-index: 0;
      z-index: auto;
      z-index: calc(var(--model-z-index) - 1);
    }
  `
	const actual = run(fixture)
	const expected = {
		total: 7,
		total_unique: 6,
		unique: {
			'0': 2,
			'1': 1,
			'99999': 1,
			'-1': 1,
			'-100': 1,
			'calc(var(--model-z-index) - 1)': 1,
		},
	}

	expect(actual).toEqual(expected)
})

test('ignores global CSS keywords', () => {
	const fixture = `
    test {
      z-index: auto;

      /* Global values */
      z-index: inherit;
      z-index: initial;
      z-index: revert;
      z-index: revert-layer;
      z-index: unset;
    }
  `
	const actual = run(fixture)
	const expected = {
		total: 0,
		total_unique: 0,
		unique: {},
	}

	expect(actual).toEqual(expected)
})
