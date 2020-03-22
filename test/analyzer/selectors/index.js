const test = require('ava')
const analyze = require('../../../src/analyzer/selectors')

test('it responds with the correct structure', t => {
  const fixture = []
  const actual = analyze(fixture)

  t.is(actual.total, 0)
  t.is(actual.totalUnique, 0)

  t.is(typeof actual.accessibility, 'object')
  t.is(typeof actual.specificity, 'object')
  t.is(typeof actual.js, 'object')
  t.is(typeof actual.id, 'object')
  t.is(typeof actual.universal, 'object')
})

test('it counts the total of all selectors', t => {
  const fixture = ['a', 'b', 'c', 'c']
  const {total: actual} = analyze(fixture)
  const expected = 4

  t.is(actual, expected)
})

test('it counts the total of all unique selectors', t => {
  const fixture = ['a', 'b', 'c', 'c']
  const {totalUnique: actual} = analyze(fixture)
  const expected = 3

  t.is(actual, expected)
})
