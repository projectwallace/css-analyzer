const test = require('ava')
const analyze = require('../../../src/analyzer/atrules/imports')

const FIXTURE = [
  {
    type: 'import',
    params: '"https://example.com/without-url"'
  },
  {
    type: 'import',
    params: 'url("https://example.com/with-url")'
  },
  {
    type: 'import',
    params:
      'url("https://example.com/with-media-query") screen and (min-width: 33em)'
  },
  {
    type: 'import',
    params:
      'url("https://example.com/with-multiple-media-queries") screen, projection'
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

  t.is(actual, 4)
})

test('it finds all unique documents and counts and sorts them', t => {
  const {unique: actual} = analyze(FIXTURE)

  t.deepEqual(actual, [
    {
      count: 1,
      value: '"https://example.com/without-url"'
    },
    {
      count: 1,
      value:
        'url("https://example.com/with-media-query") screen and (min-width: 33em)'
    },
    {
      count: 1,
      value:
        'url("https://example.com/with-multiple-media-queries") screen, projection'
    },
    {
      count: 1,
      value: 'url("https://example.com/with-url")'
    }
  ])
})

test('it counts unique documents', t => {
  const {totalUnique: actual} = analyze(FIXTURE)

  t.is(actual, 4)
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
