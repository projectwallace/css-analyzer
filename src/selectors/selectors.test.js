import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { analyze } from '../index.js'

const Selectors = suite('Selectors')

Selectors('are analyzed', () => {
  const fixture = `
    rule {
      color: green;
    }

    @media print {
      @media (min-width: 1000px) {
        @supports (display: grid) {
          another-rule {
            color: purple;
          }
        }
      }
    }
  `
  const actual = analyze(fixture).selectors

  // assert.equal(actual.total, 2)
  assert.equal(actual.totalUnique, 2)
})

Selectors('handles CSS without selectors', () => {
  const fixture = `
    @font-face {
      font-family: url('/test');
      font-family: test;
    }
  `
  const actual = analyze(fixture).selectors
  const expected = {
    total: 0,
    totalUnique: 0,
    uniquenessRatio: 0,
    specificity: {
      sum: [0, 0, 0],
      min: [0, 0, 0],
      max: [0, 0, 0],
      mean: [0, 0, 0],
      mode: [0, 0, 0],
      median: [0, 0, 0],
      items: [],
      unique: {},
      totalUnique: 0,
      uniquenessRatio: 0,
    },
    complexity: {
      min: 0,
      max: 0,
      mean: 0,
      mode: 0,
      median: 0,
      range: 0,
      sum: 0,
      total: 0,
      totalUnique: 0,
      unique: {},
      uniquenessRatio: 0,
      items: [],
    },
    id: {
      total: 0,
      totalUnique: 0,
      unique: {},
      uniquenessRatio: 0,
      ratio: 0,
    },
    accessibility: {
      total: 0,
      totalUnique: 0,
      unique: {},
      uniquenessRatio: 0,
      ratio: 0,
    },
    keyframes: {
      total: 0,
      totalUnique: 0,
      unique: {},
      uniquenessRatio: 0,
    },
  }
  assert.equal(actual, expected)
})

Selectors('have their complexity calculated', () => {
  const fixture = `
    rule {
      color: green;
    }

    @media print {
      @media (min-width: 1000px) {
        @supports (display: grid) {
          another-rule {
            color: purple;
          }
        }
      }
    }
  `
  const actual = analyze(fixture).selectors.complexity.items
  const expected = [1, 1]

  assert.equal(actual, expected)
})

Selectors('have their specificity calculated', () => {
  const fixture = `
    rule {
      color: green;
    }

    * {
      color: brown;
    }

    @media print {
      @media (min-width: 1000px) {
        @supports (display: grid) {
          another-rule {
            color: purple;
          }
        }
      }
    }
  `
  const actual = analyze(fixture)
  const expected = [
    [0, 0, 1],
    [0, 0, 0],
    [0, 0, 1]
  ]

  assert.equal(actual.selectors.specificity.items, expected)
  assert.equal(actual.selectors.total, 3)
})

Selectors('calculates selector uniqueness', () => {
  const fixture = `
    a {}
    b {}

    @media print {
      b {}
      c {}
    }
  `
  const actual = analyze(fixture).selectors

  assert.is(actual.total, 4)
  assert.is(actual.totalUnique, 3)
  assert.is(actual.uniquenessRatio, 3 / 4)
})

Selectors('counts <keyframes-selector>s', () => {
  const fixture = `
    myElement1 {
      opacity: 1;
    }

    @keyframes test1 {
      from {
        opacity: 1;
      }
      50% {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @media only screen {
      myElement2 {
        opacity: 1;
      }

      @keyframes test2 {
        from {
          opacity: 0.1;
        }
      }
    }
  `
  const actual = analyze(fixture).selectors
  assert.is(actual.total, 2)
  assert.equal(actual.keyframes, {
    total: 4,
    totalUnique: 3,
    unique: {
      from: 2,
      to: 1,
      '50%': 1
    },
    uniquenessRatio: 3 / 4,
  })
})

Selectors('counts ID selectors', () => {
  const fixture = `
    #myId,
    #myId,
    element#id,
    #multiple #ids { }

    /* Not an ID */
    [href="#hash"] { }
  `
  const actual = analyze(fixture).selectors.id
  const expected = {
    total: 4,
    totalUnique: 3,
    unique: {
      '#myId': 2,
      'element#id': 1,
      '#multiple #ids': 1,
    },
    uniquenessRatio: 3 / 4,
    ratio: 4 / 5
  }

  assert.equal(actual, expected)
})

Selectors('counts Accessibility selectors', () => {
  const fixture = `
    [aria-hidden],
    img[role="presentation"],
    .selector:not([role="tablist"]) {}

    /* false positives */
    img[loading="lazy"],
    [hidden] {}
  `
  const actual = analyze(fixture).selectors.accessibility
  const expected = {
    total: 3,
    totalUnique: 3,
    unique: {
      '[aria-hidden]': 1,
      'img[role="presentation"]': 1,
      '.selector:not([role="tablist"])': 1,
    },
    uniquenessRatio: 1 / 1,
    ratio: 3 / 5
  }

  assert.equal(actual, expected)
})

Selectors('handles emoji selectors', () => {
  const fixture = `
    .💩 {}
  `
  const result = analyze(fixture)
  const actual = result.selectors

  const expected = {
    total: 1,
    totalUnique: 1,
    uniquenessRatio: 1,
    specificity: {
      sum: [0, 1, 0],
      min: [0, 1, 0],
      max: [0, 1, 0],
      mean: [0, 1, 0],
      mode: [0, 1, 0],
      median: [0, 1, 0],
      items: [[0, 1, 0]],
      unique: {
        '0,1,0': 1,
      },
      totalUnique: 1,
      uniquenessRatio: 1 / 1,
    },
    complexity: {
      min: 1,
      max: 1,
      mean: 1,
      mode: 1,
      median: 1,
      range: 0,
      sum: 1,
      total: 1,
      totalUnique: 1,
      unique: { 1: 1 },
      uniquenessRatio: 1,
      items: [1],
    },
    id: {
      total: 0,
      totalUnique: 0,
      unique: {},
      uniquenessRatio: 0,
      ratio: 0,
    },
    accessibility: {
      total: 0,
      totalUnique: 0,
      unique: {},
      uniquenessRatio: 0,
      ratio: 0,
    },
    keyframes: {
      total: 0,
      totalUnique: 0,
      unique: {},
      uniquenessRatio: 0,
    },
  }
  assert.equal(actual, expected)
})

Selectors.run()