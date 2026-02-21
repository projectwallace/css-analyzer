import { test, expect, describe } from 'vitest'
import { analyze } from '../index.js'

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
	const actual = analyze(fixture).properties.total

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
	const actual = analyze(fixture).properties
	const expected = {
		margin: 2,
		'--custom': 2,
	}

	expect(actual.totalUnique).toEqual(2)
	expect(actual.total).toEqual(4)
	expect(actual.unique).toEqual(expected)
	expect(actual.uniquenessRatio).toEqual(2 / 4)
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
		const actual = analyze(fixture).properties.prefixed
		const expected = {
			'-webkit-border-radius': 1,
			'-khtml-border-radius': 1,
			'-o-border-radius': 2,
		}

		expect(actual.total).toEqual(4)
		expect(actual.totalUnique).toEqual(3)
		expect(actual.unique).toEqual(expected)
		expect(actual.ratio).toEqual(4 / 5)
	})

	test('normalizes to basename', () => {
		const fixture = `test { -webkit-line-clamp: 3; }`
		const expected = { 'line-clamp': 1 }
		const actual = analyze(fixture).properties.unique
		expect(actual).toEqual(expected)
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
		const actual = analyze(fixture).properties.browserhacks
		const expected = {
			'*': 3,
			_: 1,
		}

		expect(actual.total).toEqual(4)
		expect(actual.totalUnique).toEqual(2)
		expect(actual.unique).toEqual(expected)
		expect(actual.ratio).toEqual(4 / 6)
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
		const actual = analyze(fixture).properties
		const expected = {
			margin: 2,
			zoom: 1,
			property: 1,
			'--custom': 1,
		}

		expect(actual.unique).toEqual(expected)
		expect(actual.totalUnique).toEqual(4)
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
		const actual = analyze(fixture).properties.custom
		const expected = {
			'--yellow-400': 2,
			'--green-400': 1,
		}

		expect(actual.total).toEqual(3)
		expect(actual.totalUnique).toEqual(2)
		expect(actual.unique).toEqual(expected)
		expect(actual.ratio).toEqual(3 / 6)
	})

	test('normalizing properties does not lowercase custom properties', () => {
		const fixture = `
      :root {
        --testMe: 1;
      }
    `
		const actual = analyze(fixture).properties.custom
		const expected = {
			'--testMe': 1,
		}

		expect(actual.unique).toEqual(expected)
	})
})

describe('property complexity', () => {
	test('regular property', () => {
		const actual = analyze('a { property: 1 }').properties.complexity
		expect(actual.sum).toBe(1)
	})

	test('custom property', () => {
		const actual = analyze('a { --property: 1 }').properties.complexity
		expect(actual.sum).toBe(2)
	})

	test('browserhack property', () => {
		const actual = analyze('a { *property: 1 }').properties.complexity
		expect(actual.sum).toBe(2)
	})

	test('vendor prefixed property', () => {
		const actual = analyze('a { -o-property: 1 }').properties.complexity
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
		const actual = analyze(fixture).properties.complexity

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
	const actual = analyze(fixture).properties.custom.importants

	expect(actual.total).toEqual(3)
	expect(actual.totalUnique).toEqual(2)
	expect(actual.uniquenessRatio).toEqual(2 / 3)
	expect(actual.ratio).toEqual(3 / 6)
	expect(actual.unique).toEqual({
		'--color2': 2,
		'--color3': 1,
	})
})

test('reports locations correctly', () => {
	const fixture = `
    properties {
      margin: 0;
    }
  `
	const result = analyze(fixture, { locations: true })
	const actual = result.locations['properties']

	expect(actual).toEqual({
		margin: [{ offset: 24, length: 6, column: 7, line: 3 }],
	})
})
