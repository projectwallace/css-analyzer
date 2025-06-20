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

  assert.equal(actual.total, 2)
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
      items: [],
      unique: {},
      total: 0,
      totalUnique: 0,
      uniquenessRatio: 0,
    },
    complexity: {
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
      items: [],
    },
    id: {
      total: 0,
      totalUnique: 0,
      unique: {},
      uniquenessRatio: 0,
      ratio: 0,
    },
    pseudoClasses: {
      total: 0,
      totalUnique: 0,
      unique: {},
      uniquenessRatio: 0,
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
    prefixed: {
      total: 0,
      totalUnique: 0,
      unique: {},
      uniquenessRatio: 0,
      ratio: 0,
    },
    combinators: {
      total: 0,
      totalUnique: 0,
      unique: {},
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
    .selector:not([role="tablist"]),
    body.intent-mouse·[role=tabpanel][tabindex="0"]:focus,

    /* false positives */
    img[loading="lazy"],
    [hidden] {}
  `
  const actual = analyze(fixture).selectors.accessibility
  const expected = {
    total: 4,
    totalUnique: 4,
    unique: {
      '[aria-hidden]': 1,
      'img[role="presentation"]': 1,
      '.selector:not([role="tablist"])': 1,
      'body.intent-mouse·[role=tabpanel][tabindex="0"]:focus': 1,
    },
    uniquenessRatio: 1 / 1,
    ratio: 4 / 6,
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
      items: [[0, 1, 0]],
      unique: {
        '0,1,0': 1,
      },
      total: 1,
      totalUnique: 1,
      uniquenessRatio: 1 / 1,
    },
    complexity: {
      min: 1,
      max: 1,
      mean: 1,
      mode: 1,
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
    pseudoClasses: {
      total: 0,
      totalUnique: 0,
      unique: {},
      uniquenessRatio: 0,
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
    prefixed: {
      total: 0,
      totalUnique: 0,
      unique: {},
      uniquenessRatio: 0,
      ratio: 0,
    },
    combinators: {
      total: 0,
      totalUnique: 0,
      unique: {},
      uniquenessRatio: 0,
    },
    nesting: {
      min: 0,
      max: 0,
      mean: 0,
      mode: 0,
      range: 0,
      sum: 0,
      items: [0],
      total: 1,
      totalUnique: 1,
      unique: {
        0: 1,
      },
      uniquenessRatio: 1 / 1,
    },
  }
  assert.equal(actual, expected)
})

Selectors('analyzes vendor prefixed selectors', () => {
  let actual = analyze(`
    input[type=text]::-webkit-input-placeholder {
        color: green;
    }
    input[type=text]::-moz-placeholder {
        color: green;
    }
    input[type=text]:-ms-input-placeholder {
        color: green;
    }
    input[type=text]:-moz-placeholder {
      color: green;
    }

    no-prefix,
    fake-webkit,
    ::-webkit-scrollbar,
    .site-header .main-nav:hover>ul>li:nth-child(1) svg,
    :-moz-any(header, footer) {}
  `).selectors.prefixed

  assert.is(actual.total, 6)
  assert.is(actual.totalUnique, 6)
  assert.equal(actual.unique, {
    'input[type=text]::-webkit-input-placeholder': 1,
    'input[type=text]:-ms-input-placeholder': 1,
    '::-webkit-scrollbar': 1,
    ':-moz-any(header, footer)': 1,
    'input[type=text]::-moz-placeholder': 1,
    'input[type=text]:-moz-placeholder': 1,
  })
})

Selectors('counts combinators', () => {
  let result = analyze(`
    a,
    a b,
    a > b,
    a ~ b,
    a + b,
    a    b,
    a + b c > d e ~ f,
    :is(a + b, a, e > f) {
    }
  `)
  let actual = result.selectors.combinators

  assert.is(actual.total, 12)
  assert.is(actual.totalUnique, 4)
  assert.is(actual.uniquenessRatio, 4 / 12)
  assert.equal(actual.unique, {
    ' ': 4,
    '>': 3,
    '~': 2,
    '+': 3
  })
})

Selectors('tracks combinator locations', () => {
  let css = `
    a b,
    a > b,
    a
      b,
    a:not(b) c,
    a[attr] b {}
  `
  let result = analyze(css, {
    useLocations: true
  })
  let actual = result.selectors.combinators

  assert.equal(actual.uniqueWithLocations, {
    ' ': [
      {
        line: 2,
        column: 6,
        offset: 6,
        length: 1,
      },
      {
        line: 4,
        column: 6,
        offset: 26,
        length: 1,
      },
      {
        line: 6,
        column: 13,
        offset: 48,
        length: 1,
      },
      {
        line: 7,
        column: 12,
        offset: 63,
        length: 1,
      }
    ],
    '>': [
      {
        line: 3,
        column: 7,
        offset: 16,
        length: 1,
      }
    ]
  })

  let as_strings = actual.uniqueWithLocations[' ']
    .map(loc => css.substring(loc.offset, loc.offset + loc.length))
  assert.equal(as_strings, [
    ' ',
    `\n`,
    ' ',
    ' '
  ])
})

Selectors('tracks nesting depth', () => {
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
        color: rebeccapurple
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
  const actual = analyze(fixture).selectors.nesting
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

Selectors('Can keep track of selector locations if we ask it to do so', () => {
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
  let actual = analyze(fixture, { useLocations: true }).selectors.complexity.uniqueWithLocations
  let expected = {
    '1': [
      {
        line: 2,
        column: 5,
        offset: 5,
        length: 4,
      },
      {
        line: 9,
        column: 11,
        offset: 139,
        length: 12,
      }
    ]
  }

  assert.equal(actual, expected)
})

Selectors.run()