const test = require('ava')
const analyze = require('../../../src/analyzer/stylesheets/simplicity')

test('it calculates simplicity based on the ratio of total selectors and total rules', t => {
  const actual = analyze([{}], {total: 2})
  t.is(actual, 0.5)
})

// Necessary test case for CSS files that contain
// only a couple of @font-face rules, like Google Fonts
test('it calculates simplicity correctly if there are no rules and/or selectors', t => {
  const actual = analyze([], {total: 0})
  t.is(actual, 0)
})
