const test = require('ava')
const parser = require('../../src/parser')

test('basic declarations are parsed', async t => {
  const fixture = 'html, body {color:red; font-size : 12px; a: whatever;}'
  const actual = await parser(fixture)
  const expected = [{
    property: 'color',
    value: 'red',
    important: false
  }, {
    property: 'font-size',
    value: '12px',
    important: false
  }, {
    property: 'a',
    value: 'whatever',
    important: false
  }]

  t.deepEqual(actual.declarations, expected)
})

test('!important is parsed', async t => {
  const fixture = 'html { color: red !important; content: \'!important\'; color: blue; }'
  const actual = await parser(fixture)
  const expected = [{
    property: 'color',
    value: 'red',
    important: true
  }, {
    property: 'content',
    value: '\'!important\'',
    important: false
  }, {
    property: 'color',
    value: 'blue',
    important: false
  }]

  t.deepEqual(actual.declarations, expected)
})
