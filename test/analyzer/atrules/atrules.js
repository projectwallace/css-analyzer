const test = require('ava')
const analyze = require('../../../src/analyzer/atrules/charsets')

const FIXTURE = [
  {
    type: 'charset',
    params: 'B'
  },
  {
    type: 'charset',
    params: 'A'
  },
  {
    type: 'charset',
    params: 'A'
  }
]

test('it responds with the correct structure', t => [
  t.deepEqual(analyze([]), {
    total: 0,
    totalUnique: 0,
    unique: []
  })
])

test('it counts charsets', t => {
  const {total: actual} = analyze(FIXTURE)

  t.is(actual, 3)
})

test('it finds all unique charsets and counts and sorts them', t => {
  const {unique: actual} = analyze(FIXTURE)

  t.deepEqual(actual, [{count: 2, value: 'A'}, {value: 'B', count: 1}])
})

test('it counts unique charsets', t => {
  const {totalUnique: actual} = analyze(FIXTURE)

  t.is(actual, 2)
})

test('it does not report non-charset atrules as charset', t => {
  const actual = analyze([
    {
      type: 'media',
      params: 'X'
    },
    {
      type: 'document',
      params: 'X'
    }
  ])

  t.deepEqual(actual, {
    total: 0,
    totalUnique: 0,
    unique: []
  })
})
