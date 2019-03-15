const test = require('ava')
const analyze = require('../../../src/analyzer/atrules/supports')

const FIXTURE = [
  {
    type: 'supports',
    params: '(filter: blur(5px))'
  },
  {
    type: 'supports',
    params: '(display: table-cell) and (display: list-item)'
  },
  {
    type: 'supports',
    params: '(-webkit-appearance:none)'
  },
  {
    type: 'supports',
    params: '(-webkit-appearance:none)'
  }
]

test('it responds with the correct structure', t => [
  t.deepEqual(analyze([]), {
    total: 0,
    totalUnique: 0,
    unique: [],
    browserhacks: {
      total: 0,
      totalUnique: 0,
      unique: []
    }
  })
])

test('it counts @supports rules', t => {
  const {total: actual} = analyze(FIXTURE)

  t.is(actual, 4)
})

test('it finds all unique @supports rules and counts and sorts them', t => {
  const {unique: actual} = analyze(FIXTURE)

  t.deepEqual(actual, [
    {
      count: 2,
      value: '(-webkit-appearance:none)'
    },
    {
      count: 1,
      value: '(display: table-cell) and (display: list-item)'
    },
    {
      count: 1,
      value: '(filter: blur(5px))'
    }
  ])
})

test('it counts unique documents', t => {
  const {totalUnique: actual} = analyze(FIXTURE)

  t.is(actual, 3)
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
    unique: [],
    browserhacks: {
      total: 0,
      totalUnique: 0,
      unique: []
    }
  })
})

test('it recognizes @supports browserhacks', t => {
  const {
    browserhacks: {total, totalUnique, unique}
  } = analyze(FIXTURE)

  t.is(total, 2)
  t.is(totalUnique, 1)
  t.deepEqual(unique, [
    {
      value: '(-webkit-appearance:none)',
      count: 2
    }
  ])
})
