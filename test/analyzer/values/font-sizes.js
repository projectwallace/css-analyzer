const test = require('ava')
const analyze = require('../../../src/analyzer/values/font-sizes.js')

const NO_FONT_SIZES = {
  total: 0,
  unique: [],
  totalUnique: 0
}

test('It responds with the correct structure', t => {
  const actual = analyze([])
  const expected = NO_FONT_SIZES

  t.deepEqual(actual, expected)
})

test('It recognizes a font-size correctly', t => {
  const fixtures = ['10px', 'small', '1em', 'calc(3vw + 1em)']

  fixtures.forEach(value => {
    t.deepEqual(analyze([{property: 'font-size', value}]), {
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

test('It extracts a font-size correctly from the `font` shorthand', t => {
  const fixtures = [
    ['1.1em serif', '1.1em'],
    ['medium serif', 'medium'],
    ['normal normal 1.2em serif', '1.2em'],
    ['400 1.3em/1 serif', '1.3em'],
    ['1em / 1 serif', '1em'],
    ['1em/ 1 serif', '1em'],
    ['1em /1 serif', '1em']
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
      NO_FONT_SIZES
    )
  })
})

test('It sorts multiple font-sizes correctly, from large to small', t => {
  const expected = {
    total: 4,
    unique: [
      {
        value: '64px',
        count: 1
      },
      {
        value: '3rem',
        count: 1
      },
      {
        value: '1em',
        count: 1
      },
      {
        value: '10px',
        count: 1
      }
    ],
    totalUnique: 4
  }
  const actual = analyze(
    ['10px', '1em', '3rem', '64px'].map(value => ({
      property: 'font-size',
      value
    }))
  )

  t.deepEqual(actual, expected)
})

test('It ignores properties that do not contain a font-size', t => {
  const expected = NO_FONT_SIZES
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
