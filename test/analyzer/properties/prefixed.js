const test = require('ava')
const analyze = require('../../../src/analyzer/properties/prefixed')

test('it responds with the correct structure', t => {
  const actual = analyze([])
  const expected = {
    total: 0,
    share: 0,
    totalUnique: 0,
    unique: []
  }

  t.deepEqual(actual, expected)
})

const FIXTURE = [
  'color',
  '-webkit-animation',
  '-webkit-animation', // Duplicate
  '-moz-appearance'
]

test('it counts prefixed properties', t => {
  const {total: actual} = analyze(FIXTURE)

  t.is(actual, 3)
})

test('it calculates the prefixed share', t => {
  const {share: actual} = analyze(FIXTURE)

  t.is(actual, 0.75)
})

test('it finds the unique prefixed properties and counts and sorts them', t => {
  const {unique: actual} = analyze(FIXTURE)
  const expected = [
    {
      value: '-moz-appearance',
      count: 1
    },
    {
      value: '-webkit-animation',
      count: 2
    }
  ]

  t.deepEqual(actual, expected)
})

test('it counts the total unique prefixed properties', t => {
  const {totalUnique: actual} = analyze(FIXTURE)

  t.is(actual, 2)
})
