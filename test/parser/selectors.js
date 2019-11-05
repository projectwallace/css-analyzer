const test = require('ava')
const parser = require('../../src/parser')

test('basic selectors are parsed', async t => {
  const fixture = `
    html,
    body {}

    html:first-child {}
  `
  const {selectors: actual} = await parser(fixture)
  const expected = ['html', 'body', 'html:first-child']

  t.deepEqual(actual, expected)
})

test('basic selectors example 2 are parsed', async t => {
  const fixture = `
    .a,
    {}
  `
  const {selectors: actual} = await parser(fixture)
  const expected = ['.a']

  t.deepEqual(actual, expected)
})

test('basic selectors example 3 are parsed', async t => {
  const fixture = `
    .a,
    .b,
    .c,
    .d,
    .e,
    {}
  `
  const {selectors: actual} = await parser(fixture)
  const expected = ['.a', '.b', '.c', '.d', '.e']

  t.deepEqual(actual, expected)
})

test('"selectors" in @keyframes are not passed as actual selectors', async t => {
  const fixture = `
    @keyframes no-selector {
      no-selector-1 { opacity: 1 }
      no-selector-2 { opacity: 0 }
    }

    @-webkit-keyframes {
      0% { opacity: 0 }
      100% { opacity: 1 }
    }
  `

  const {selectors: actual} = await parser(fixture)
  const expected = []

  t.deepEqual(actual, expected)
})
