const test = require('ava')
const analyze = require('../../../src/analyzer/selectors/js')

test('it responds with the correct structure', t => {
  const fixture = []
  const {total, totalUnique, unique} = analyze(fixture)

  t.is(total, 0)
  t.is(totalUnique, 0)
  t.deepEqual(unique, [])
})

test('it counts the total of all js selectors', t => {
  const fixture = ['.js-show', '.js-hide', '.js-show']
  const {total: actual} = analyze(fixture)

  t.is(actual, 3)
})

test('it counts the total of all unique js selectors', t => {
  const fixture = ['.js-show', '.js-hide', '.js-show']
  const {totalUnique: actual} = analyze(fixture)

  t.is(actual, 2)
})

test('it finds all unique js selectors, sorts them and adds a count', t => {
  const fixture = ['.js-show', '.js-hide', '.js-show']
  const {unique: actual} = analyze(fixture)
  const expected = [
    {
      value: '.js-hide',
      count: 1
    },
    {
      value: '.js-show',
      count: 2
    }
  ]

  t.deepEqual(actual, expected)
})

test('it does not report selectors that are not js selectors', t => {
  const fixture = ['.no-js', 'test']
  const {total, totalUnique, unique} = analyze(fixture)

  t.is(total, 0)
  t.is(totalUnique, 0)
  t.deepEqual(unique, [])
})
