const test = require('ava')
const analyze = require('../../../src/analyzer/rules')

test('it responds with the correct structure', t => {
  const actual = analyze([])

  t.deepEqual(actual, {
    total: 0,
    empty: {
      total: 0
    }
  })
})

test('it counts basic rules', t => {
  const {total} = analyze([{declarationsCount: 1}, {declarationsCount: 8}])
  t.is(total, 2)
})

test('it counts empty rules', t => {
  const actual = analyze([{declarationsCount: 1}, {declarationsCount: 0}])
  t.is(actual.empty.total, 1)
})
