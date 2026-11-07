import { describe, test, expect } from 'vitest'
import { analyze } from '../engine/analyzer.js'
import { plain, series } from '../test-utils.js'
import { rules } from './rules.js'

/** Rule results with the shape the old tests were written for */
function run(css: string) {
	const { result } = analyze(css, { result: rules({ sequence: true }) })
	return {
		total: result.total,
		empty: { total: result.empty },
		sizes: series(result.sizes),
		nesting: series(result.nesting),
		selectors: series(result.selectors),
		declarations: series(result.declarations),
	}
}

test('should count rules', () => {
	const actual = run(`
    html {
      color: black;
    }
    test {}
  `).total
	expect(actual).toEqual(2)
})

test('should handle CSS without rules', () => {
	const fixture = `@media (min-width: 0px) {}`
	const actual = run(fixture)
	const expected = {
		total: 0,
		empty: {
			total: 0,
		},
		sizes: {
			min: 0,
			max: 0,
			mean: 0,
			mode: 0,
			range: 0,
			sum: 0,
			items: [],
			unique: {},
			total: 0,
			total_unique: 0,
		},
		selectors: {
			min: 0,
			max: 0,
			mean: 0,
			mode: 0,
			range: 0,
			sum: 0,
			items: [],
			unique: {},
			total: 0,
			total_unique: 0,
		},
		declarations: {
			min: 0,
			max: 0,
			mean: 0,
			mode: 0,
			range: 0,
			sum: 0,
			items: [],
			unique: {},
			total: 0,
			total_unique: 0,
		},
		nesting: {
			min: 0,
			max: 0,
			mean: 0,
			mode: 0,
			range: 0,
			sum: 0,
			items: [],
			total: 0,
			total_unique: 0,
			unique: {},
		},
	}
	expect(actual).toEqual(expected)
})

test('counts sizes of rules', () => {
	const actual = run(`
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
  `).sizes

	const expected = {
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
		total_unique: 4,
	}
	expect(actual).toEqual(expected)
})

test('should count empty rules', () => {
	expect(run(`test{}`).empty.total).toEqual(1)
	expect(run('@media print {}').empty.total).toEqual(0)
	expect(
		run(`
    @media print {
      empty {}
    }
  `).empty.total,
	).toEqual(1)
	expect(run('test { color: red; }').empty.total).toEqual(0)
})

test('calculate the minimum selectors', () => {
	expect(
		run(`
    html {}
    a,
    b {}
  `).selectors.min,
	).toEqual(1)
})

test('calculate the maximum selectors', () => {
	expect(
		run(`
    html {}
    a,
    b {}
  `).selectors.max,
	).toEqual(2)
})

test('calculate the mode of selectors', () => {
	expect(
		run(`
    html {}
    a,
    b {}
    x {}
  `).selectors.mode,
	).toEqual(1)
})

test('calculate the mean of selectors', () => {
	expect(
		run(`
    html {}
    a,
    b {}
  `).selectors.mean,
	).toEqual(1.5)
})

test('calculate the range of selectors', () => {
	expect(
		run(`
    html {}

    a,
    b {}

    a,
    b,
    c {}
  `).selectors.range,
	).toEqual(2)
})

test('calculate the minimum declarations', () => {
	expect(
		run(`
    html {}
    test {
      color: red;
    }
  `).declarations.min,
	).toEqual(0)
	expect(run('@media print {}').declarations.min).toEqual(0)
})

test('calculate the maximum declarations', () => {
	expect(
		run(`
    html {}
    test {
      a: 1;
      b: 2;
      c: 3;
    }
  `).declarations.max,
	).toEqual(3)

	expect(
		run(`
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
  `).declarations.max,
	).toEqual(4)
})

test('calculate the mode of declarations', () => {
	expect(
		run(`
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
  `).declarations.mode,
	).toEqual(1)
})

test('calculate the mean of declarations', () => {
	expect(
		run(`
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
  `).declarations.mean,
	).toEqual(2)
})

test('calculate the range of declarations', () => {
	expect(
		run(`
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
  `).declarations.range,
	).toEqual(2)
})

test('return a list of declaration counts per rule', () => {
	const actual = run(`
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
  `).declarations.items
	const expected = [1, 2, 3, 2, 0]
	expect(actual).toEqual(expected)
})

test('return a list of selectors counts per rule', () => {
	const actual = run(`
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
  `).declarations.items
	const expected = [1, 2, 3, 2]
	expect(actual).toEqual(expected)
})

test('counts unique numbers of selectors per rule', () => {
	const result = run(`
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
  `).selectors

	expect(result.unique).toEqual({
		1: 2,
		2: 1,
		3: 1,
	})
	expect(result.total_unique).toEqual(3)
})

test('counts unique numbers of declarations per rule', () => {
	const result = run(`
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
  `).declarations

	expect(result.unique).toEqual({
		1: 1,
		2: 2,
		3: 1,
	})
	expect(result.total_unique).toEqual(3)
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
	const actual = run(fixture).nesting
	const expected = {
		min: 0,
		max: 2,
		mean: 0.75,
		mode: 0,
		range: 2,
		sum: 3,
		items: [0, 0, 1, 2],
		total: 4,
		total_unique: 3,
		unique: {
			0: 2,
			1: 1,
			2: 1,
		},
	}
	expect(actual).toEqual(expected)
})
