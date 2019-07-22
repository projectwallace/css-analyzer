const test = require('ava')
const analyze = require('../../../src/analyzer/values/text-shadows.js')

test('It responds with the correct structure', t => {
  const actual = analyze([])
  const expected = {
    total: 0,
    unique: [],
    totalUnique: 0
  }

  t.deepEqual(actual, expected)
})

test('It recognizes a simple/single text-shadow correctly', t => {
  const fixture = [
    '1px 1px 2px black',
    '#fc0 1px 0 10px',
    '5px 5px #558abb',
    'white 2px 5px',
    '5px 10px',
    'red 0 -2px',
    '1px 1px 2px black, 0 0 1em blue, 0 0 0.2em blue'
  ]
  const actual = analyze(
    fixture.map(textShadow => ({property: 'text-shadow', value: textShadow}))
  )
  const expected = {
    total: 7,
    unique: [
      {value: '#fc0 1px 0 10px', count: 1},
      {value: '1px 1px 2px black', count: 1},
      {value: '1px 1px 2px black, 0 0 1em blue, 0 0 0.2em blue', count: 1},
      {value: '5px 5px #558abb', count: 1},
      {value: '5px 10px', count: 1},
      {value: 'red 0 -2px', count: 1},
      {value: 'white 2px 5px', count: 1}
    ],
    totalUnique: 7
  }

  t.deepEqual(actual, expected)
})

test('It recognizes an advanced text-shadow with multiple shadows', t => {
  const actual = analyze([
    {
      property: 'text-shadow',
      value: '1px 1px 2px black, 0 0 1em blue, 0 0 0.2em blue'
    }
  ])
  const expected = {
    total: 1,
    unique: [
      {
        value: '1px 1px 2px black, 0 0 1em blue, 0 0 0.2em blue',
        count: 1
      }
    ],
    totalUnique: 1
  }

  t.deepEqual(actual, expected)
})

test('It ignores CSS keywords', t => {
  const expected = {
    total: 0,
    totalUnique: 0,
    unique: []
  }
  const actual = analyze([
    {
      property: 'text-shadow',
      value: 'none'
    },
    {
      property: 'text-shadow',
      value: 'inherit'
    },
    {
      property: 'text-shadow',
      value: 'initial'
    },
    {
      property: 'text-shadow',
      value: 'unset'
    }
  ])

  t.deepEqual(actual, expected)
})
