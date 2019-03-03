const test = require('ava')
const analyze = require('../../../src/analyzer/values/font-families.js')

const NO_FONT_FAMILIES = {
  total: 0,
  unique: [],
  totalUnique: 0
}

test('It responds with the correct structure', t => {
  const actual = analyze([])
  const expected = NO_FONT_FAMILIES

  t.deepEqual(actual, expected)
})

test('It recognizes a font-family correctly', t => {
  const fixtures = [
    '"Droid Sans", serif',
    'sans-serif',
    '"Arial Black", "Arial Bold", Gadget, sans-serif',
    '"Brush Script MT", cursive',
    'monospace',
    'Consolas, "Liberation Mono", Menlo, Courier, monospace',
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"'
  ]

  fixtures.forEach(value => {
    t.deepEqual(analyze([{property: 'font-family', value}]), {
      total: 1,
      unique: [
        {
          count: 1,
          value
        }
      ],
      totalUnique: 1
    })
  })
})

test('It extracts a font-family correctly from the `font` shorthand', t => {
  // Results may vary due to a bug in shorthand-expand:
  // ->  https://github.com/kapetan/css-shorthand-expand/issues/8
  const fixtures = [
    ['large "Noto Sans"', '"Noto Sans"'],
    [
      'normal normal 1em/1 "Source Sans Pro", serif',
      '"Source Sans Pro", serif'
    ],
    ['normal normal 1.2em serif', 'serif'],
    ['400 1.3em/1 serif', 'serif'],
    ['1em / 1 serif', 'serif'],
    ['1em/ 1 serif', 'serif'],
    ['1em /1 serif', 'serif'],
    [
      'normal normal 11px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
      '"-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"'
    ],
    [
      '11px Consolas, "Liberation Mono", Menlo, Courier, monospace',
      '"Consolas", "Liberation Mono", "Menlo", "Courier", monospace'
    ]
  ]

  fixtures.forEach(([provider, expectedValue]) => {
    t.deepEqual(analyze([{property: 'font', value: provider}]), {
      total: 1,
      unique: [
        {
          count: 1,
          value: expectedValue
        }
      ],
      totalUnique: 1
    })
  })
})

test('It ignores keywords, and global values', t => {
  const fixtures = ['inherit', 'initial', 'auto', 'unset']

  fixtures.forEach(value => {
    t.deepEqual(
      analyze([{property: 'font-size', value}, {property: 'font', value}]),
      NO_FONT_FAMILIES
    )
  })
})

test('It sorts multiple font-families correctly', t => {
  const expected = {
    total: 3,
    unique: [
      {
        value: 'a',
        count: 1
      },
      {
        value: 'b',
        count: 1
      },
      {
        value: 'c',
        count: 1
      }
    ],
    totalUnique: 3
  }
  const actual = analyze(
    ['c', 'a', 'b'].map(value => ({
      property: 'font-family',
      value
    }))
  )

  t.deepEqual(actual, expected)
})

test('It ignores properties that do not contain a font-family', t => {
  const expected = NO_FONT_FAMILIES
  const actual = analyze([
    {
      property: 'line-height',
      value: '1'
    },
    {
      property: 'margin',
      value: '0'
    }
  ])

  t.deepEqual(actual, expected)
})
