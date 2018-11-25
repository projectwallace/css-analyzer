const test = require('ava')
const analyze = require('../../../src/analyzer/selectors/browserhacks.js')

test('It responds with the correct structure', t => {
  const actual = analyze([])
  const expected = {
    total: 0,
    unique: [],
    totalUnique: 0
  }

  t.deepEqual(actual, expected)
})

test('It recognizes browser hacks correctly', t => {
  const actual = analyze(['* html .selector'])
  const expected = {
    total: 1,
    unique: [
      {
        value: '* html .selector',
        count: 1
      }
    ],
    totalUnique: 1
  }

  t.deepEqual(actual, expected)
})

test('It does not report values that are not browser hacks', t => {
  const expected = {
    total: 0,
    unique: [],
    totalUnique: 0
  }

  const actual = analyze(['html'])

  t.deepEqual(actual, expected)
})
