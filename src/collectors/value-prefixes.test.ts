import { test, expect } from 'vitest'
import { analyze } from '../engine/analyzer.ts'
import { plain } from '../test-utils.ts'
import { value_prefixes } from './values.ts'

function run(css: string) {
	return plain(analyze(css, { result: value_prefixes() }).result)
}

test('finds simple prefixes', () => {
	const fixture = `
    value-vendor-prefix-simple {
      width: -moz-max-content;
      width: -webkit-max-content;
      box-shadow: 0 0 0 3px -moz-mac-focusring;
      position: -webkit-sticky;
      -webkit-transition: -webkit-transform 0.3s ease-out;
      -moz-transition: -moz-transform 0.3s ease-out;
      -o-transition: -o-transform 0.3s ease-out;
      transition: -o-transform 0.3s ease-out;
    }

    not-a-prefix {
      background: var(--test);
      margin: -0.3em;
    }

    @supports (position: -webkit-sticky) {
      thing {
        position: -webkit-sticky;
        position: sticky;
      }
    }
  `
	const actual = run(fixture)
	const expected = {
		total: 9,
		total_unique: 7,
		unique: {
			'-moz-max-content': 1,
			'-webkit-max-content': 1,
			'-moz-mac-focusring': 1,
			'-webkit-sticky': 2,
			'-webkit-transform': 1,
			'-moz-transform': 1,
			'-o-transform': 2,
		},
	}

	expect(actual).toEqual(expected)
})

test('normalizes prefixes', () => {
	const fixture = `
    value-vendor-prefix-simple {
      width: -moz-max-content;
      WIDTH: -MOZ-MAX-CONTENT;
    }
  `
	const actual = run(fixture)
	const expected = {
		total: 2,
		total_unique: 1,
		unique: {
			'-moz-max-content': 2,
		},
	}

	expect(actual).toEqual(expected)
})

test('finds nested prefixes', () => {
	const fixture = `
    value-vendor-prefix-nested {
      background-image: -khtml-linear-gradient(90deg, red, green);
      background:
        red,
        -webkit-linear-gradient(transparent, transparent),
        -moz-linear-gradient(transparent, transparent),
        -ms-linear-gradient(transparent, transparent),
        -o-linear-gradient(transparent, transparent);
      grid-template-columns: repeat(3, max(-webkit-max-content, 100vw));
    }
  `
	const actual = run(fixture)
	const expected = {
		total: 6,
		total_unique: 6,
		unique: {
			'-khtml-linear-gradient': 1,
			'-webkit-linear-gradient': 1,
			'-moz-linear-gradient': 1,
			'-ms-linear-gradient': 1,
			'-o-linear-gradient': 1,
			'-webkit-max-content': 1,
		},
	}

	expect(actual).toEqual(expected)
})

test('finds DEEPLY nested prefixes', () => {
	const fixture = `
    value-vendor-prefix-deeply-nested {
      width: var(--test, -webkit-max-content);
    }
  `
	const actual = run(fixture)
	const expected = {
		total: 1,
		total_unique: 1,
		unique: {
			'-webkit-max-content': 1,
		},
	}

	expect(actual).toEqual(expected)
})
