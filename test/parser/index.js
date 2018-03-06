const test = require('ava')
const parser = require('../../src/parser')

test('parser returns a Promise', t => {
  t.true(parser('a{}') instanceof Promise)
})

test('parser returns a list of @rules', async t => {
  const actual = await parser('a{}')
  t.true(Array.isArray(actual.atRules))
})

test('parser returns a list of rules', async t => {
  const actual = await parser('a{}')
  t.true(Array.isArray(actual.rules))
})

test('parser returns a list of selectors', async t => {
  const actual = await parser('a{}')
  t.true(Array.isArray(actual.selectors))
})

test('parser returns a list of declarations', async t => {
  const actual = await parser('a{}')
  t.true(Array.isArray(actual.declarations))
})

test('parser handles incorrect css', async t => {
  // Notice the missing ; after the first declaration
  // It is intentional to trigger an error
  const cssWithSyntaxError = `
    a {
      font-size: 16px
      background: red;
    }`

  await t.throws(parser(cssWithSyntaxError))
})
