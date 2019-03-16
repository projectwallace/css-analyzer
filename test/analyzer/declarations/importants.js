const test = require('ava')
const analyze = require('../../../src/analyzer/declarations/importants')

const FIXTURE = [
  {
    property: 'color',
    value: 'red',
    important: true
  },
  {
    property: 'border-width',
    value: '1px',
    important: true
  },
  {
    property: 'font-size',
    value: '16px',
    important: false
  }
]

test('it responds with the correct structure', t => {
  t.deepEqual(analyze([]), {
    total: 0,
    share: 0
  })
})

test('it counts !importants', t => {
  const {total: actual} = analyze(FIXTURE)

  t.is(actual, 2)
})

test('it calculates the share of !important declarations', t => {
  const {share: actual} = analyze(FIXTURE)

  t.is(actual, (1 / 3) * 2)
})
