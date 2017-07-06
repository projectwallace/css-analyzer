const test = require('ava')
const parser = require('../../src/parser')

test('basic selectors are parsed', async t => {
  const fixture = 'html, body {} html:first-child {}'
  const actual = await parser(fixture)
  const expected = [
    'html',
    'body',
    'html:first-child'
  ]

  t.deepEqual(actual.selectors, expected)
})
