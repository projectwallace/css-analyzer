const test = require('ava')
const parser = require('../../src/parser')

test('basic rules are parsed', async t => {
  const fixture = 'html {color:red} @media screen { html {} }'
  const actual = await parser(fixture)
  const expected = [{declarationsCount: 1}, {declarationsCount: 0}]

  t.deepEqual(actual.rules, expected)
})

test('declarations per rule are counted', async t => {
  const fixture = 'html, body {color:red; font-size : 12px} .foo {color: red;}'
  const actual = await parser(fixture)
  const expected = [2, 1].map(num => ({declarationsCount: num}))
  t.deepEqual(actual.rules, expected)
})

test('heavily nested rules are parsed', async t => {
  const fixture = `
    @media screen {
      @media print {
        @media (min-width: 1px) {
          .rule2 {
            color: red;
          }
        }
      }
    }
  `
  const actual = await parser(fixture)
  const expected = [{declarationsCount: 1}]
  t.deepEqual(actual.rules, expected)
})
