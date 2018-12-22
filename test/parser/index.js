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

test('parser throws a useful error on invalid CSS', async t => {
  const cssWithSyntaxError = 'a { color red }'
  const error = await t.throwsAsync(parser(cssWithSyntaxError))

  t.is(
    error.message,
    'Unknown word at line 1, column 5. Source: a { color red }'
  )
})
