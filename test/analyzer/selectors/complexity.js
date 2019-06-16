const test = require('ava')
const analyze = require('../../../src/analyzer/selectors/complexity')

test('it responds with the correct structure', t => {
  const fixture = []
  const actual = analyze(fixture)
  const expected = {
    max: {
      value: 0,
      count: 0,
      selectors: []
    },
    average: 0,
    sum: 0,
    unique: [],
    totalUnique: 0
  }

  t.deepEqual(actual, expected)
})

const FIXTURE = [
  'a b c',
  'a b',
  'a b c d',
  'a b c d e',
  'a b c d e f',
  'g h i j k l'
]

test('it finds the selectors with the highest complexity', t => {
  const {max: actual} = analyze(FIXTURE)
  const expected = {
    value: 6,
    count: 2,
    selectors: [
      {value: 'a b c d e f', count: 1},
      {value: 'g h i j k l', count: 1}
    ]
  }

  t.deepEqual(actual, expected)
})

test('it finds the selectors with the highest complexity and only shows the unique ones', t => {
  const {max: actual} = analyze([...FIXTURE, 'a b c d e f'])
  const expected = {
    value: 6,
    count: 2,
    selectors: [
      {value: 'a b c d e f', count: 2},
      {value: 'g h i j k l', count: 1}
    ]
  }

  t.deepEqual(actual, expected)
})

test('it counts the sum of all selector complexities', t => {
  const {sum: actual} = analyze(FIXTURE)
  const expected = 3 + 2 + 4 + 5 + 6 + 6
  t.is(actual, expected)
})

test('it finds all unique complexities of all selectors', t => {
  const {unique: actual} = analyze(FIXTURE)
  const expected = [
    {value: 2, count: 1},
    {value: 3, count: 1},
    {value: 4, count: 1},
    {value: 5, count: 1},
    {value: 6, count: 2}
  ]
  t.deepEqual(actual, expected)
})

test('it finds the total unique complexities of all selectors', t => {
  const {totalUnique: actual} = analyze(FIXTURE)
  const expected = 5
  t.deepEqual(actual, expected)
})

test('it calculates the average complexity per selector', t => {
  const {average: actual} = analyze(FIXTURE)

  t.is(actual, 26 / 6)
})
