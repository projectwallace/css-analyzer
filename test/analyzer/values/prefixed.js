const test = require('ava')
const analyze = require('../../../src/analyzer/values/prefixed.js')

test('It responds with the correct structure', t => {
  const actual = analyze([])
  const expected = {
    total: 0,
    unique: [],
    totalUnique: 0,
    share: 0
  }

  t.deepEqual(actual, expected)
})

test('It recognizes prefixed values correctly', t => {
  const fixtures = [
    '-webkit-gradient(transparent, transparent)',
    '-moz-linear-gradient(transparent, transparent)',
    '-ms-linear-gradient(transparent, transparent)',
    '-o-linear-gradient(transparent, transparent)'
  ]

  fixtures.forEach(value => {
    t.deepEqual(analyze([value]), {
      total: 1,
      unique: [{count: 1, value}],
      totalUnique: 1,
      share: 1
    })
  })
})

test('It sorts multiple prefixed values correctly', t => {
  const fixtures = [
    '-webkit-gradient(transparent, transparent)',
    '-moz-linear-gradient(transparent, transparent)',
    '-ms-linear-gradient(transparent, transparent)',
    '-o-linear-gradient(transparent, transparent)'
  ]
  const expected = {
    share: 1,
    total: 4,
    totalUnique: 4,
    unique: [
      {
        count: 1,
        value: '-moz-linear-gradient(transparent, transparent)'
      },
      {
        count: 1,
        value: '-ms-linear-gradient(transparent, transparent)'
      },
      {
        count: 1,
        value: '-o-linear-gradient(transparent, transparent)'
      },
      {
        count: 1,
        value: '-webkit-gradient(transparent, transparent)'
      }
    ]
  }

  t.deepEqual(analyze(fixtures), expected)
})

test('It calculates the share correctly', t => {
  const provider = [
    [['-webkit-test', 'no-prefix'], 0.5],
    [['-webkit-test', 'test1', 'test2', 'test3'], 0.25],
    [['test1', 'test2'], 0],
    [[], 0]
  ]

  provider.forEach(([values, expected]) => {
    t.is(analyze(values).share, expected)
  })
})

test('It ignores values that are not prefixed', t => {
  const expected = {
    total: 0,
    unique: [],
    totalUnique: 0,
    share: 0
  }
  const actual = analyze([
    {
      property: 'line-height',
      value: '1'
    },
    {
      property: 'margin',
      value: '0'
    },
    {property: '-webkit-border-radius', value: '0'},
    {property: '-moz-border-radius', value: '0'},
    {property: '-o-border-radius', value: '0'},
    {property: 'border-radius', value: '0'},
    {property: 'background', value: 'linear-gradient(transparent, transparent)'}
  ])

  t.deepEqual(actual, expected)
})
