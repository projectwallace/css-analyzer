const test = require('ava')
const testScope = require('../../utils/scope-tester.js')

const SCOPE = 'selectors'

test(SCOPE, async t => {
  const {actual, expected} = await testScope(SCOPE)
  t.deepEqual(actual[SCOPE], expected)
})
