import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { analyze } from '../index.js'

const Rules = suite('Rules')

Rules('should count rules', () => {
  assert.is(analyze(`
    html {
      color: black;
    }
    test {}
  `).rules.total, 2)
})

Rules('should handle CSS without rules', () => {
  const fixture = `@media (min-width: 0px) {}`
  const actual = analyze(fixture)
  const expected = {
    total: 0,
    empty: {
      total: 0,
      ratio: 0
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
      items: [],
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
      items: [],
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
      items: [],
      total: 0,
      totalUnique: 0,
      unique: {},
      uniquenessRatio: 0,
    }
  }
  assert.equal(actual.rules, expected)
})

Rules('counts sizes of rules', () => {
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
  `)
  const actual = result.rules.sizes

  assert.equal(actual, {
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
  })
})

Rules('should count empty rules', () => {
  assert.is(1, analyze(`test{}`).rules.empty.total)
  assert.is(analyze('@media print {}').rules.empty.total, 0)
  assert.is(analyze(`
    @media print {
      empty {}
    }
  `).rules.empty.total, 1)
  assert.is(analyze('test { color: red; }').rules.empty.total, 0)
})

Rules('calculate the minimum selectors', () => {
  assert.is(analyze(`
    html {}
    a,
    b {}
  `).rules.selectors.min, 1)
})

Rules('calculate the maximum selectors', () => {
  assert.is(analyze(`
    html {}
    a,
    b {}
  `).rules.selectors.max, 2)
})

Rules('calculate the mode of selectors', () => {
  assert.is(analyze(`
    html {}
    a,
    b {}
    x {}
  `).rules.selectors.mode, 1)
})

Rules('calculate the mean of selectors', () => {
  assert.is(analyze(`
    html {}
    a,
    b {}
  `).rules.selectors.mean, 1.5)
})

Rules('calculate the range of selectors', () => {
  assert.is(analyze(`
    html {}

    a,
    b {}

    a,
    b,
    c {}
  `).rules.selectors.range, 2)
})


Rules('calculate the minimum declarations', () => {
  assert.is(analyze(`
    html {}
    test {
      color: red;
    }
  `).rules.declarations.min, 0)
  assert.is(analyze('@media print {}').rules.declarations.min, 0)
})

Rules('calculate the maximum declarations', () => {
  assert.is(analyze(`
    html {}
    test {
      a: 1;
      b: 2;
      c: 3;
    }
  `).rules.declarations.max, 3)

  assert.is(analyze(`
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
  `).rules.declarations.max, 4)
})

Rules('calculate the mode of declarations', () => {
  assert.is(analyze(`
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
  `).rules.declarations.mode, 1)
})

Rules('calculate the mean of declarations', () => {
  assert.is(analyze(`
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
  `).rules.declarations.mean, 2)
})

Rules('calculate the range of declarations', () => {
  assert.is(analyze(`
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
  `).rules.declarations.range, 2)
})

Rules('return a list of declaration counts per rule', () => {
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
  `).rules.declarations.items
  const expected = [1, 2, 3, 2, 0]
  assert.equal(actual, expected)
})

Rules('return a list of selectors counts per rule', () => {
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
  `).rules.declarations.items
  const expected = [1, 2, 3, 2]
  assert.equal(actual, expected)
})

Rules('counts unique numbers of selectors per rule', () => {
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

  assert.equal(result.unique, {
    1: 2,
    2: 1,
    3: 1,
  })
  assert.is(result.totalUnique, 3)
  assert.is(result.uniquenessRatio, 3 / 4)
})

Rules('counts unique numbers of declarations per rule', () => {
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

  assert.equal(result.unique, {
    1: 1,
    2: 2,
    3: 1,
  })
  assert.is(result.totalUnique, 3)
  assert.is(result.uniquenessRatio, 3 / 4)
})



Rules('tracks nesting depth', () => {
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
  const actual = analyze(fixture).rules.nesting
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
  assert.equal(actual, expected)
})

Rules.run()