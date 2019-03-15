const test = require('ava')
const analyze = require('../../../src/analyzer/atrules/pages')

const FIXTURE = [
  {
    type: 'page',
    params: ''
  },
  {
    type: 'page',
    params: ':first'
  },
  {
    type: 'page',
    params: ':left'
  },
  {
    type: 'page',
    params: ':right'
  }
]

test('it responds with the correct structure', t => [
  t.deepEqual(analyze([]), {
    total: 0,
    totalUnique: 0,
    unique: []
  })
])

test('it counts pages', t => {
  const {total: actual} = analyze(FIXTURE)

  t.is(actual, 4)
})

test('it finds all unique pages and counts and sorts them', t => {
  const {unique: actual} = analyze(FIXTURE)

  t.deepEqual(actual, [
    {
      count: 1,
      value: ''
    },
    {
      count: 1,
      value: ':first'
    },
    {
      count: 1,
      value: ':left'
    },
    {
      count: 1,
      value: ':right'
    }
  ])
})

test('it counts unique pages', t => {
  const {totalUnique: actual} = analyze(FIXTURE)

  t.is(actual, 4)
})

test('it does not report non-page atrules as page', t => {
  const actual = analyze([
    {
      type: 'media',
      params: 'X'
    },
    {
      type: 'charset',
      params: 'X'
    }
  ])

  t.deepEqual(actual, {
    total: 0,
    totalUnique: 0,
    unique: []
  })
})
