const test = require('ava')
const analyze = require('../../../src/analyzer/atrules/documents')

const FIXTURE = [
  {
    type: 'document',
    params: 'url("https://example.com")'
  },
  {
    type: 'charset',
    params: 'A'
  },
  {
    type: 'document',
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

test('it counts documents', t => {
  const {total: actual} = analyze(FIXTURE)

  t.is(actual, 2)
})

test('it finds all unique documents and counts and sorts them', t => {
  const {unique: actual} = analyze(FIXTURE)

  t.deepEqual(actual, [
    {count: 1, value: 'A'},
    {value: 'url("https://example.com")', count: 1}
  ])
})

test('it counts unique documents', t => {
  const {totalUnique: actual} = analyze(FIXTURE)

  t.is(actual, 2)
})

test('it does not report non-document atrules as document', t => {
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
