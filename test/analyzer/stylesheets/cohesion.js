const test = require('ava')
const analyze = require('../../../src/analyzer/stylesheets/cohesion')

test('it calculates cohesion based on the ratio of total declarations and total rules', t => {
  const {average: actual} = analyze({total: 2}, {total: 4})
  t.is(actual, 2)
})

test('it calculates cohesion correctly if there are no rules and/or declarations', t => {
  const {average: actual} = analyze({total: 0}, {total: 0})
  t.is(actual, 0)
})
