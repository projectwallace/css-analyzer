import { test, expect } from 'vitest'
import { analyze } from '../index.js'

test('should count rules', () => {
	let actual = analyze(`
    html {
      color: black;
    }
    test {}
  `).rules.total
	expect(actual).toEqual(2)
})

test('should handle CSS without rules', () => {
	const fixture = `@media (min-width: 0px) {}`
	const actual = analyze(fixture).rules
	const expected = {
		total: 0,
		empty: {
			total: 0,
			ratio: 0,
		},
		sizes: {
			min: 0,
			max: 0,
			mean: 0,
			mode: 0,
			range: 0,
			sum: 0,
			unique: {},
			total: 0,
			totalUnique: 0,
			uniquenessRatio: 0,
		},
		selectors: {
			min: 0,
			max: 0,
			mean: 0,
			mode: 0,
			range: 0,
			sum: 0,
			unique: {},
			total: 0,
			totalUnique: 0,
			uniquenessRatio: 0,
		},
		declarations: {
			min: 0,
			max: 0,
			mean: 0,
			mode: 0,
			range: 0,
			sum: 0,
			unique: {},
			total: 0,
			totalUnique: 0,
			uniquenessRatio: 0,
		},
		nesting: {
			min: 0,
			max: 0,
			mean: 0,
			mode: 0,
			range: 0,
			sum: 0,
			total: 0,
			totalUnique: 0,
			unique: {},
			uniquenessRatio: 0,
		},
	}
	expect(actual).toEqual(expected)
})

test('counts sizes of rules', () => {
	const actual = analyze(`
    x {
      a: 1;
    }
    a,
    b {
      a: 1;
      b: 2;
    }
    c,
    d,
    e {
      a: 1;
      b: 2;
      c: 3;
    }

    @media print {
      @supports (display: grid) {
        f {
          a: 1;
          b: 2;
        }
      }
    }
  `, { samples: true }).rules.sizes

	let expected = {
		min: 2,
		max: 6,
		mean: 3.75,
		mode: 3.75,
		range: 4,
		sum: 15,
		items: [2, 4, 6, 3],
		unique: {
			2: 1,
			4: 1,
			6: 1,
			3: 1,
		},
		total: 4,
		totalUnique: 4,
		uniquenessRatio: 4 / 4,
	}
	expect(actual).toEqual(expected)
})

test('should count empty rules', () => {
	expect(analyze(`test{}`).rules.empty.total).toEqual(1)
	expect(analyze('@media print {}').rules.empty.total).toEqual(0)
	expect(
		analyze(`
    @media print {
      empty {}
    }
  `).rules.empty.total,
	).toEqual(1)
	expect(analyze('test { color: red; }').rules.empty.total).toEqual(0)
})

test('calculate the minimum selectors', () => {
	expect(
		analyze(`
    html {}
    a,
    b {}
  `).rules.selectors.min,
	).toEqual(1)
})

test('calculate the maximum selectors', () => {
	expect(
		analyze(`
    html {}
    a,
    b {}
  `).rules.selectors.max,
	).toEqual(2)
})

test('calculate the mode of selectors', () => {
	expect(
		analyze(`
    html {}
    a,
    b {}
    x {}
  `).rules.selectors.mode,
	).toEqual(1)
})

test('calculate the mean of selectors', () => {
	expect(
		analyze(`
    html {}
    a,
    b {}
  `).rules.selectors.mean,
	).toEqual(1.5)
})

test('calculate the range of selectors', () => {
	expect(
		analyze(`
    html {}

    a,
    b {}

    a,
    b,
    c {}
  `).rules.selectors.range,
	).toEqual(2)
})

test('calculate the minimum declarations', () => {
	expect(
		analyze(`
    html {}
    test {
      color: red;
    }
  `).rules.declarations.min,
	).toEqual(0)
	expect(analyze('@media print {}').rules.declarations.min).toEqual(0)
})

test('calculate the maximum declarations', () => {
	expect(
		analyze(`
    html {}
    test {
      a: 1;
      b: 2;
      c: 3;
    }
  `).rules.declarations.max,
	).toEqual(3)

	expect(
		analyze(`
    html {}
    test {
      a: 1;
      b: 2;
      c: 3;
    }

    @media print {
      test {
        a: 1;
        b: 2;
        c: 3;
        d: 4;
      }
    }
  `).rules.declarations.max,
	).toEqual(4)
})

test('calculate the mode of declarations', () => {
	expect(
		analyze(`
    html {
      a: 1;
    }
    test {
      a: 1;
    }
    test {
      a: 1;
      b: 2;
    }
  `).rules.declarations.mode,
	).toEqual(1)
})

test('calculate the mean of declarations', () => {
	expect(
		analyze(`
    html {
      a: 1;
    }
    a {
      a: 1;
      b: 2;
    }
    b {
      a: 1;
      b: 2;
      c: 3;
    }
  `).rules.declarations.mean,
	).toEqual(2)
})

test('calculate the range of declarations', () => {
	expect(
		analyze(`
    html {
      a: 1;
    }
    a {
      a: 1;
      b: 2;
    }
    b {
      a: 1;
      b: 2;
      c: 3;
    }
  `).rules.declarations.range,
	).toEqual(2)
})

test('return a list of declaration counts per rule', () => {
	const actual = analyze(`
    html {
      a: 1;
    }
    a {
      a: 1;
      b: 2;
    }
    b {
      a: 1;
      b: 2;
      c: 3;
    }

    @media print {
      @supports (display: grid) {
        c {
          a: 1;
          b: 2;
        }
        d {}
      }
    }
  `, { samples: true }).rules.declarations.items
	const expected = [1, 2, 3, 2, 0]
	expect(actual).toEqual(expected)
})

test('return a list of selectors counts per rule', () => {
	const actual = analyze(`
    x {
      a: 1;
    }
    a,
    b {
      a: 1;
      b: 2;
    }
    c,
    d,
    e {
      a: 1;
      b: 2;
      c: 3;
    }

    @media print {
      @supports (display: grid) {
        f {
          a: 1;
          b: 2;
        }
      }
    }
  `, { samples: true }).rules.declarations.items
	const expected = [1, 2, 3, 2]
	expect(actual).toEqual(expected)
})

test('counts unique numbers of selectors per rule', () => {
	const result = analyze(`
    x {
      a: 1;
    }
    a,
    b {
      a: 1;
      b: 2;
    }
    c,
    d,
    e {
      a: 1;
      b: 2;
      c: 3;
    }

    @media print {
      @supports (display: grid) {
        f {
          a: 1;
          b: 2;
        }
      }
    }
  `).rules.selectors

	expect(result.unique).toEqual({
		1: 2,
		2: 1,
		3: 1,
	})
	expect(result.totalUnique).toEqual(3)
	expect(result.uniquenessRatio).toEqual(3 / 4)
})

test('counts unique numbers of declarations per rule', () => {
	const result = analyze(`
    x {
      a: 1;
    }
    a,
    b {
      a: 1;
      b: 2;
    }
    c,
    d,
    e {
      a: 1;
      b: 2;
      c: 3;
    }

    @media print {
      @supports (display: grid) {
        f {
          a: 1;
          b: 2;
        }
      }
    }
  `).rules.declarations

	expect(result.unique).toEqual({
		1: 1,
		2: 2,
		3: 1,
	})
	expect(result.totalUnique).toEqual(3)
	expect(result.uniquenessRatio).toEqual(3 / 4)
})

test('tracks nesting depth', () => {
	const fixture = `
    a {
      color: red;
    }

    b {
      color: green;

      &:hover {
        color: blue;
      }

      color: deepskyblue;

      @container (width > 400px) {
        color: rebeccapurple;
      }
    }

    @media print {
      @supports (display: grid) {
        c {
          color: orange;
        }
      }
    }
  `
	const actual = analyze(fixture, { samples: true }).rules.nesting
	const expected = {
		min: 0,
		max: 2,
		mean: 0.75,
		mode: 0,
		range: 2,
		sum: 3,
		items: [0, 0, 1, 2],
		total: 4,
		totalUnique: 3,
		unique: {
			0: 2,
			1: 1,
			2: 1,
		},
		uniquenessRatio: 3 / 4,
	}
	expect(actual).toEqual(expected)
})
