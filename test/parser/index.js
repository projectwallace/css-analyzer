const test = require('ava')
const parser = require('../../src/parser')

test('parser returns a Promise', t => {
  t.true(parser('') instanceof Promise)
})

test('parser returns a list of @rules', async t => {
  const actual = await parser('')
  t.truthy(actual.atRules)
})

test('parser returns a list of rules', async t => {
  const actual = await parser('')
  t.truthy(actual.rules)
})

test('parser returns a list of selectors', async t => {
  const actual = await parser('')
  t.truthy(actual.selectors)
})

test('parser returns a list of declarations', async t => {
  const actual = await parser('')
  t.truthy(actual.declarations)
})
