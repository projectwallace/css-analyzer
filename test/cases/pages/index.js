const test = require('ava')
const testScope = require('../../scope-tester.js')

const SCOPE = 'pages'

test(SCOPE, async t => {
  const {actual, expected} = await testScope(SCOPE)
  t.deepEqual(actual[SCOPE], expected)
})
