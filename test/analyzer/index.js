const test = require('ava')
const analyzer = require('../..')

test('Breaks with invalid CSS', async t => {
  await t.throws(analyzer('INVALID CSS'))
})

test('Passes with valid CSS', async t => {
  await t.notThrows(analyzer('body {}'))
})
