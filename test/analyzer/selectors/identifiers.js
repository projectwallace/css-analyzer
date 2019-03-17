const test = require('ava')
const analyze = require('../../../src/analyzer/selectors/identifiers')

test('it responds with the correct structure', t => {
  const fixture = []
  const actual = analyze(fixture)
  const expected = {
    max: {
      value: null,
      count: null
    },
    top: [],
    average: 0
  }

  t.deepEqual(actual, expected)
})

const FIXTURE = ['a b c', 'a b', 'a b c d', 'a b c d e', 'a b c d e f']

test('it finds the selectors with the most identifiers and it sorts them by count', t => {
  const {top: actual} = analyze(FIXTURE)
  const expected = [
    {
      value: 'a b c d e f',
      count: 6
    },
    {
      value: 'a b c d e',
      count: 5
    },
    {
      value: 'a b c d',
      count: 4
    },
    {
      value: 'a b c',
      count: 3
    },
    {
      value: 'a b',
      count: 2
    }
  ]

  t.deepEqual(actual, expected)
  t.is(actual.length, 5)
})

test('if selectors with the same identifier count are found, they are sorted alphabetically', t => {
  const fixture = ['y z', 'a b c', 'a b', 'a b c d', 'a b c d e', 'a b c d e f']
  const {top: actual} = analyze(fixture)
  const expected = [
    {
      value: 'a b c d e f',
      count: 6
    },
    {
      value: 'a b c d e',
      count: 5
    },
    {
      value: 'a b c d',
      count: 4
    },
    {
      value: 'a b c',
      count: 3
    },
    {
      value: 'a b',
      count: 2
    }
  ]

  t.deepEqual(actual, expected)
})

test('it finds the selector with the most identifiers', t => {
  const {max: actual} = analyze(FIXTURE)

  t.is(actual.count, 6)
  t.is(actual.value, 'a b c d e f')
})

test('it calculates the average amount of identifiers per selector', t => {
  const {average: actual} = analyze(FIXTURE)

  t.is(actual, 24 / 6)
})
