const test = require('ava')
const analyze = require('../../../src/analyzer/selectors/id')

test('it responds with the correct structure', t => {
  const fixture = []
  const {total, totalUnique, unique} = analyze(fixture)

  t.is(total, 0)
  t.is(totalUnique, 0)
  t.deepEqual(unique, [])
})

test('it counts the total of all id selectors', t => {
  const fixture = ['#myId', '#myId', 'element#id', '.class #id #plus #two']
  const {total: actual} = analyze(fixture)
  const expected = 4

  t.is(actual, expected)
})

test('it counts the total of all unique id selectors', t => {
  const fixture = ['#myId', '#myId', 'element#id', '.class #id #plus #two']
  const {totalUnique: actual} = analyze(fixture)
  const expected = 3

  t.is(actual, expected)
})

test('it finds all unique id selectors, sorts them and adds a count', t => {
  const fixture = ['#myId', '#myId', 'element#id', '.class #id']
  const {unique: actual} = analyze(fixture)
  const expected = [
    {
      value: '#myId',
      count: 2
    },
    {
      value: '.class #id',
      count: 1
    },
    {
      value: 'element#id',
      count: 1
    }
  ]

  t.deepEqual(actual, expected)
})

test('it does not report selectors that are not id selectors', t => {
  const fixture = ['class[href="#hash"]']
  const {total, totalUnique, unique} = analyze(fixture)

  t.is(total, 0)
  t.is(totalUnique, 0)
  t.deepEqual(unique, [])
})
