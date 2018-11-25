const test = require('ava')
const analyze = require('../../../src/analyzer/stylesheets/browserhacks.js')

test('it counts the totals of browserhacks correctly', t => {
  const atRules = {
    mediaqueries: {
      browserhacks: {
        total: 1,
        totalUnique: 1
      }
    },
    supports: {
      browserhacks: {
        total: 2,
        totalUnique: 2
      }
    }
  }
  const selectors = {
    browserhacks: {
      total: 1,
      totalUnique: 1
    }
  }
  const properties = {
    browserhacks: {
      total: 1,
      totalUnique: 1
    }
  }
  const values = {
    browserhacks: {
      total: 1,
      totalUnique: 1
    }
  }
  const expected = {
    total: 6,
    totalUnique: 6
  }
  const actual = analyze(atRules, selectors, properties, values)

  t.deepEqual(actual, expected)
})
