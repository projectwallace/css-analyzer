const test = require('ava')
const parser = require('../../src/parser')

test('basic rules are parsed', async t => {
  const fixture = 'html {} @media screen { html {} }'
  const actual = await parser(fixture)
  const expected = 2

  t.is(actual.rules.length, expected)
})

test('declarations per rule are counted', async t => {
  const fixture = ('html, body {color:red; font-size : 12px} .foo {color: red;}')
  const actual = await parser(fixture)
  const expected = [2, 1].map(num => {
    return {declarationsCount: num}
  })
  t.deepEqual(actual.rules, expected)
})
