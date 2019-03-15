const test = require('ava')
const analyze = require('../../../src/analyzer/atrules/namespaces')

const FIXTURE = [
  {
    type: 'namespace',
    params: 'url(http://www.w3.org/1999/xhtml)'
  },
  {
    type: 'namespace',
    params: 'svg url(http://www.w3.org/2000/svg)'
  }
]

test('it responds with the correct structure', t => [
  t.deepEqual(analyze([]), {
    total: 0,
    totalUnique: 0,
    unique: []
  })
])

test('it counts @namespaces', t => {
  const {total: actual} = analyze(FIXTURE)

  t.is(actual, 2)
})

test('it finds all unique @namespaces and counts and sorts them', t => {
  const {unique: actual} = analyze(FIXTURE)

  t.deepEqual(actual, [
    {count: 1, value: 'svg url(http://www.w3.org/2000/svg)'},
    {count: 1, value: 'url(http://www.w3.org/1999/xhtml)'}
  ])
})

test('it counts unique @namespaces', t => {
  const {totalUnique: actual} = analyze(FIXTURE)

  t.is(actual, 2)
})

test('it does not report non-@namespace atrules as @namespace', t => {
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
