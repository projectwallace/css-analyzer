import { describe, test, expect } from 'vitest'
import { analyze } from '../engine/analyzer.ts'
import { plain } from '../test-utils.ts'
import { summarize_numbers } from '../engine/summary.ts'
import { properties } from './properties.ts'

/** Property results with the shape the old tests were written for */
function run(css: string) {
	const { result } = analyze(css, { result: properties() })
	const { min, max, mean, mode, range, sum } = summarize_numbers(result.complexity)
	return {
		...plain(result),
		prefixed: plain(result.prefixed),
		custom: {
			...plain(result.custom),
			defined: result.custom.defined,
			used: result.custom.used,
			unused: result.custom.unused,
			unknown: result.custom.unknown,
			importants: plain(result.custom.importants),
		},
		shorthands: plain(result.shorthands),
		browserhacks: plain(result.browserhacks),
		complexity: { min, max, mean, mode, range, sum },
		anchor_names: result.anchor_names,
	}
}

test('counts totals', () => {
	const fixture = `
    properties {
      margin: 0;
      --custom: 1;
    }

    @media print {
      nested {
        --custom: 2;
      }
    }
  `
	const actual = run(fixture).total

	expect(actual).toEqual(3)
})

test('calculates uniqueness', () => {
	const fixture = `
    properties {
      margin: 0;
      MARGIN: 0;
      --custom: 1;
    }

    @media print {
      nested {
        --custom: 1;
      }
    }
  `
	const actual = run(fixture)
	const expected = {
		margin: 2,
		'--custom': 2,
	}

	expect(actual.total_unique).toEqual(2)
	expect(actual.total).toEqual(4)
	expect(actual.unique).toEqual(expected)
})

describe('vendor prefixes', () => {
	test('counts vendor prefixes', () => {
		const fixture = `
    prefixed {
      border-radius: 2px;
      -webkit-border-radius: 2px;
      -khtml-border-radius: 2px;
      -o-border-radius: 2px;
    }

    @media (min-width: 0) {
      @supports (-o-border-radius: 2px) {
        prefixed2 {
          -o-border-radius: 4px;
        }
      }
    }
  `
		const actual = run(fixture).prefixed
		const expected = {
			'-webkit-border-radius': 1,
			'-khtml-border-radius': 1,
			'-o-border-radius': 2,
		}

		expect(actual.total).toEqual(4)
		expect(actual.total_unique).toEqual(3)
		expect(actual.unique).toEqual(expected)
	})

	test('normalizes to basename', () => {
		const fixture = `test { -webkit-line-clamp: 3; }`
		const expected = { 'line-clamp': 1 }
		const actual = run(fixture).unique
		expect(actual).toEqual(expected)
	})
})

describe('shorthands', () => {
	test('counts shorthand properties', () => {
		const fixture = `
      a {
        margin: 0;
        padding: 0;
        color: red;
        font: bold 1em/1.5 sans-serif;
      }
    `
		const actual = run(fixture).shorthands

		expect(actual.total).toEqual(3)
		expect(actual.total_unique).toEqual(3)
		expect(actual.unique).toEqual({ margin: 1, padding: 1, font: 1 })
	})

	test('counts duplicate shorthands', () => {
		const fixture = `
      a { margin: 0; }
      b { margin: 10px; }
    `
		const actual = run(fixture).shorthands

		expect(actual.total).toEqual(2)
		expect(actual.total_unique).toEqual(1)
		expect(actual.unique).toEqual({ margin: 2 })
	})

	test('non-shorthand properties are not counted', () => {
		const fixture = `a { color: red; font-size: 1em; }`
		const actual = run(fixture).shorthands

		expect(actual.total).toEqual(0)
		expect(actual.total_unique).toEqual(0)
		expect(actual.unique).toEqual({})
	})

	test('preserves original casing of shorthand property name', () => {
		const fixture = `a { MARGIN: 0; }`
		const actual = run(fixture).shorthands

		expect(actual.total).toEqual(1)
		expect(actual.unique).toEqual({ MARGIN: 1 })
	})

	test('counts shorthands inside at-rules', () => {
		const fixture = `
      @media screen {
        a { padding: 0; }
      }
    `
		const actual = run(fixture).shorthands

		expect(actual.total).toEqual(1)
		expect(actual.unique).toEqual({ padding: 1 })
	})
})

describe('browserhacks', () => {
	test('counts browser hacks', () => {
		const fixture = `
    hacks {
      margin: 0;
      *zoom: 1;
      *margin: 0;
      _property: 0;
      --custom: 1;
    }

    @media (min-width: 0) {
      @supports (-o-border-radius: 2px) {
        hacks2 {
          *zoom: 1;
        }
      }
    }
  `
		const actual = run(fixture).browserhacks
		const expected = {
			'*': 3,
			_: 1,
		}

		expect(actual.total).toEqual(4)
		expect(actual.total_unique).toEqual(2)
		expect(actual.unique).toEqual(expected)
	})

	test('normalizes browserhacks props to basename', () => {
		const fixture = `
      hacks {
        margin: 0;
        *zoom: 1;
        *margin: 0;
        _property: 0;
        --custom: 1;
      }
    `
		const actual = run(fixture)
		const expected = {
			margin: 2,
			zoom: 1,
			property: 1,
			'--custom': 1,
		}

		expect(actual.unique).toEqual(expected)
		expect(actual.total_unique).toEqual(4)
	})
})

describe('custom properties', () => {
	test('counts custom properties', () => {
		const fixture = `
      :root {
        --yellow-400: yellow;
      }

      custom {
        margin: 0;
        --yellow-400: yellow;
        color: var(--yellow-400);
      }

      @media (min-width: 0) {
        @supports (-o-border-radius: 2px) {
          custom2 {
            --green-400: green;
            color: var(--green-400);
          }
        }
      }
    `
		const actual = run(fixture).custom
		const expected = {
			'--yellow-400': 2,
			'--green-400': 1,
		}

		expect(actual.total).toEqual(3)
		expect(actual.total_unique).toEqual(2)
		expect(actual.unique).toEqual(expected)
	})

	test('normalizing properties does not lowercase custom properties', () => {
		const fixture = `
      :root {
        --testMe: 1;
      }
    `
		const actual = run(fixture).custom
		const expected = {
			'--testMe': 1,
		}

		expect(actual.unique).toEqual(expected)
	})
})

describe('property complexity', () => {
	test('regular property', () => {
		const actual = run('a { property: 1 }').complexity
		expect(actual.sum).toBe(1)
	})

	test('custom property', () => {
		const actual = run('a { --property: 1 }').complexity
		expect(actual.sum).toBe(2)
	})

	test('browserhack property', () => {
		const actual = run('a { *property: 1 }').complexity
		expect(actual.sum).toBe(2)
	})

	test('vendor prefixed property', () => {
		const actual = run('a { -o-property: 1 }').complexity
		expect(actual.sum).toBe(2)
	})

	test('counts totals', () => {
		const fixture = `
    .property-complexity-fixture {
      regular-property: 1;
      --my-custom-property: 2;
      *browserhack-property: 2;
      -webkit-property: 2;
    }
  `
		const actual = run(fixture).complexity

		expect.soft(actual.max).toEqual(2)
		expect.soft(actual.mean).toEqual(1.75)
		expect.soft(actual.min).toEqual(1)
		expect.soft(actual.mode).toEqual(2)
		expect.soft(actual.range).toEqual(1)
		expect.soft(actual.sum).toEqual(7)
	})
})

test('counts the amount of !important used on custom properties', () => {
	const fixture = `
    .property {
      color: blue;
      --color1: red;
      --color2: yellow !important;
    }

    @media screen {
      .property {
        color: blue;
        --color1: red;
        --color2: yellow !important;
      }
    }

    @layer test {
      .property {
        color: blue;
        --color1: red;
        --color3: green !important;
      }
    }
  `
	const actual = run(fixture).custom.importants

	expect(actual.total).toEqual(3)
	expect(actual.total_unique).toEqual(2)
	expect(actual.unique).toEqual({
		'--color2': 2,
		'--color3': 1,
	})
})
