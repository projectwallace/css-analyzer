const test = require('ava')
const analyze = require('../../../src/analyzer/selectors/accessibility')

test('it responds with the correct structure', t => {
  const fixture = []
  const {total, totalUnique, unique} = analyze(fixture)

  t.is(total, 0)
  t.is(totalUnique, 0)
  t.deepEqual(unique, [])
})

test('it counts the total of all accessibility selectors', t => {
  const fixture = ['[aria-hidden]', '[aria-hidden]', 'img[role="presentation"]']
  const {total: actual} = analyze(fixture)
  const expected = 3

  t.is(actual, expected)
})

test('it counts the total of all unique accessibility selectors', t => {
  const fixture = ['[aria-hidden]', '[aria-hidden]', 'img[role="presentation"]']
  const {totalUnique: actual} = analyze(fixture)
  const expected = 2

  t.is(actual, expected)
})

test('it finds all unique accessibility selectors, sorts them and adds a count', t => {
  const fixture = ['[aria-hidden]', '[aria-hidden]', 'img[role="presentation"]']
  const {unique: actual} = analyze(fixture)
  const expected = [
    {
      value: '[aria-hidden]',
      count: 2
    },
    {
      value: 'img[role="presentation"]',
      count: 1
    }
  ]

  t.deepEqual(actual, expected)
})

test('it does not report selectors that are not accessibility selectors', t => {
  const fixture = ['img[data-lazy]', '[hidden]']
  const {total, totalUnique, unique} = analyze(fixture)

  t.is(total, 0)
  t.is(totalUnique, 0)
  t.deepEqual(unique, [])
})
