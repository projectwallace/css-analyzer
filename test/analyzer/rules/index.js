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
      min: 0 /** @deprecated */,
      minimum: {
        count: 0,
        value: []
      },
      max: 0 /** @deprecated */,
      maximum: {
        count: 0,
        value: []
      },
      average: 0
    }
  })
})

test('it counts basic rules', t => {
  const {total} = analyze([
    {declarations: [], selectors: ['a']},
    {declarations: [], selectors: ['b']}
  ])
  t.is(total, 2)
})

test('it counts empty rules', t => {
  const actual = analyze([
    {
      declarations: [{property: 'a', value: 'a', important: false}],
      selectors: ['a']
    },
    {declarations: [], selectors: ['a']}
  ])
  const expected = 1
  t.is(actual.empty.total, expected)
})

test('it counts the average selectors per rule', t => {
  const actual = analyze([
    {selectors: ['a', 'b', 'c', 'd'], declarations: []},
    {selectors: ['a'], declarations: []}
  ])
  const expected = 2.5

  t.is(actual.selectors.average, expected)
})

test('it counts the minimum selectors per rule', t => {
  const actual = analyze([
    {selectors: ['a', 'b', 'c', 'd'], declarations: []},
    {selectors: ['a'], declarations: []}
  ])

  t.is(actual.selectors.minimum.count, 1)
  t.deepEqual(actual.selectors.minimum.value, ['a'])
})

test('it counts the maximum selectors per rule', t => {
  const actual = analyze([
    {selectors: ['a', 'b', 'c', 'd'], declarations: []},
    {selectors: ['a'], declarations: []}
  ])

  t.is(actual.selectors.maximum.count, 4)
  t.deepEqual(actual.selectors.maximum.value, ['a', 'b', 'c', 'd'])
})

test('it sorts the minimum selectors per rule by string length and alphabetically', t => {
  const actual = analyze([
    {selectors: ['aa'], declarations: []},
    {selectors: ['A'], declarations: []},
    {selectors: ['b'], declarations: []},
    {selectors: ['bb'], declarations: []}
  ])

  t.is(actual.selectors.minimum.count, 1)
  t.deepEqual(actual.selectors.minimum.value, ['A'])
})

/**
 * @deprecated in v3.0.0
 */
test('it counts the min selectors per rule', t => {
  const actual = analyze([
    {selectors: ['a', 'b', 'c', 'd'], declarations: []},
    {selectors: ['a'], declarations: []}
  ])
  const expected = 1

  t.is(actual.selectors.min, expected)
})

/**
 * @deprecated v3.0.0
 */
test('it counts the max selectors per rule', t => {
  const actual = analyze([
    {selectors: ['a', 'b', 'c', 'd'], declarations: []},
    {selectors: ['a'], declarations: []}
  ])
  const expected = 4

  t.is(actual.selectors.max, expected)
})
