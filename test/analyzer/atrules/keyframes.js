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
    unique: []
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

  t.deepEqual(actual, {
    total: 0,
    totalUnique: 0,
    unique: []
  })
})
