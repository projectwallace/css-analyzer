const test = require('ava')
const analyze = require('../../../src/analyzer/rules')

test('it responds with the correct structure', t => {
  const actual = analyze([])

  t.deepEqual(actual, {
    total: 0,
    empty: {
      total: 0
    },
    selectors: {
      min: 0,
      max: 0,
      average: 0
    }
  })
})

test('it counts basic rules', t => {
  const {total} = analyze([{declarationsCount: 1}, {declarationsCount: 8}])
  t.is(total, 2)
})

test('it counts empty rules', t => {
  const {
    empty: {total}
  } = analyze([{declarationsCount: 1}, {declarationsCount: 0}])
  const expected = 1
  t.is(total, expected)
})

test('it counts the average selectors per rule', t => {
  const {
    selectors: {average}
  } = analyze([{selectorsCount: 1}, {selectorsCount: 4}])
  const expected = 2.5

  t.is(average, expected)
})

test('it counts the min selectors per rule', t => {
  const {
    selectors: {min}
  } = analyze([{selectorsCount: 1}, {selectorsCount: 4}])
  const expected = 1

  t.is(min, expected)
})

test('it counts the max selectors per rule', t => {
  const {
    selectors: {max}
  } = analyze([{selectorsCount: 1}, {selectorsCount: 4}])
  const expected = 4

  t.is(max, expected)
})
