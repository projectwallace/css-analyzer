const test = require('ava')
const analyze = require('../../../src/analyzer/atrules/keyframes')

const FIXTURE = [
  {
    type: 'keyframes',
    params: 'ANIMATION'
  },
  {
    type: '-webkit-keyframes',
    params: 'ANIMATION'
  },
  {
    type: '-moz-keyframes',
    params: 'ANIMATION'
  },
  {
    type: '-ms-keyframes',
    params: 'ANIMATION'
  },
  {
    type: '-o-keyframes',
    params: 'ANIMATION'
  },
  {
    type: 'keyframes',
    params: 'ANIMATION_2'
  }
]

test('it responds with the correct structure', t => [
  t.deepEqual(analyze([]), {
    total: 0,
    totalUnique: 0,
    unique: [],
    prefixed: {
      total: 0,
      totalUnique: 0,
      unique: [],
      share: 0
    }
  })
])

test('it counts @keyframes', t => {
  const {total: actual} = analyze(FIXTURE)

  t.is(actual, 6)
})

test('it finds all unique @keyframes and counts and sorts them', t => {
  const {unique: actual} = analyze(FIXTURE)

  t.deepEqual(actual, [
    {count: 5, value: 'ANIMATION'},
    {count: 1, value: 'ANIMATION_2'}
  ])
})

test('it counts unique @keyframes', t => {
  const {totalUnique: actual} = analyze(FIXTURE)

  t.is(actual, 2)
})

test('it finds all vendor prefixed keyframes', t => {
  const fixture = [
    {
      type: '-webkit-keyframes',
      params: 'ANIMATION'
    },
    {
      type: '-moz-keyframes',
      params: 'ANIMATION'
    },
    {
      type: '-ms-keyframes',
      params: 'ANIMATION'
    },
    {
      type: '-o-keyframes',
      params: 'ANIMATION'
    }
  ]
  const {prefixed: actual} = analyze(fixture)

  t.is(actual.total, 4)
  t.is(actual.totalUnique, 4)
  t.is(actual.share, 1)
  t.deepEqual(actual.unique, [
    {
      count: 1,
      value: '@-moz-keyframes ANIMATION'
    },
    {
      count: 1,
      value: '@-ms-keyframes ANIMATION'
    },
    {
      count: 1,
      value: '@-o-keyframes ANIMATION'
    },
    {
      count: 1,
      value: '@-webkit-keyframes ANIMATION'
    }
  ])
})

test('it does not report non-vendor prefixed keyframes as prefixed', t => {
  const fixture = [
    {
      type: 'keyframes',
      params: 'ANIMATION'
    },
    {
      type: 'keyframes',
      params: '-webkit-animation-name'
    }
  ]
  const {prefixed: actual} = analyze(fixture)

  t.is(actual.total, 0)
  t.is(actual.totalUnique, 0)
  t.is(actual.share, 0)
  t.deepEqual(actual.unique, [])
})

test('it does not report non-@keyframes atrules as @keyframes', t => {
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

  t.is(actual.total, 0)
  t.is(actual.totalUnique, 0)
  t.deepEqual(actual.unique, [])
})
