const test = require('ava')
const testScope = require('../../../utils/scope-tester.js')

const SCOPE = 'atrules/charsets'

test(SCOPE, async t => {
  const {actual, expected} = await testScope(SCOPE)
  t.deepEqual(actual.atrules.charsets, expected)
})
