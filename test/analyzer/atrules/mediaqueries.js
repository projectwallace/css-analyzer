const test = require('ava')
const analyze = require('../../../src/analyzer/atrules/mediaqueries')

const FIXTURE = [
  {
    type: 'media',
    params: 'screen'
  },
  {
    type: 'media',
    params: 'url("some-file-in-mq.css")'
  },
  {
    type: 'media',
    params: 'screen and (min-width: 33em)'
  },
  {
    type: 'media',
    params: '(min-width: 20px)'
  },
  {
    type: 'media',
    params: '(max-width: 200px)'
  },
  {
    type: 'media',
    params: 'screen or print'
  },
  {
    type: 'media',
    params: 'print'
  },
  {
    type: 'media',
    params: '\\0 all'
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

test('it counts @media rules', t => {
  const {total: actual} = analyze(FIXTURE)

  t.is(actual, 8)
})

test('it finds all unique @media rules and counts and sorts them', t => {
  const {unique: actual} = analyze(FIXTURE)

  t.deepEqual(actual, [
    {
      count: 1,
      value: '(max-width: 200px)'
    },
    {
      count: 1,
      value: '(min-width: 20px)'
    },
    {
      count: 1,
      value: '\\0 all'
    },
    {
      count: 1,
      value: 'print'
    },
    {
      count: 1,
      value: 'screen'
    },
    {
      count: 1,
      value: 'screen and (min-width: 33em)'
    },
    {
      count: 1,
      value: 'screen or print'
    },
    {
      count: 1,
      value: 'url("some-file-in-mq.css")'
    }
  ])
})

test('it counts unique @media at-rules', t => {
  const {totalUnique: actual} = analyze(FIXTURE)

  t.is(actual, 8)
})

test('it does not report non-media atrules as @media', t => {
  const actual = analyze([
    {
      type: 'namespace',
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

test('it recognizes @media browserhacks', t => {
  const {
    browserhacks: {total, totalUnique, unique}
  } = analyze(FIXTURE)

  t.is(total, 1)
  t.is(totalUnique, 1)
  t.deepEqual(unique, [
    {
      value: '\\0 all',
      count: 1
    }
  ])
})
