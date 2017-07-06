const test = require('ava')
const parser = require('../../src/parser')

test('parser returns a Promise', t => {
  t.true(parser('') instanceof Promise)
})

test('parser returns a list of @rules', async t => {
  const actual = await parser('')
  t.true(Array.isArray(actual.atRules))
})

test('parser returns a list of rules', async t => {
  const actual = await parser('')
  t.true(Array.isArray(actual.rules))
})

test('parser returns a list of selectors', async t => {
  const actual = await parser('')
  t.true(Array.isArray(actual.selectors))
})

test('parser returns a list of declarations', async t => {
  const actual = await parser('')
  t.true(Array.isArray(actual.declarations))
})
