const test = require('ava')
const parser = require('../../src/parser/index.js')

let result
let fixture

test.before(async () => {
  fixture = ('@charset "UTF-8"; @import "some.css";@supports (display: grid) { @media screen{ @media (min-width: 300px) { .foo {color:blue} } } } html, body {color:red; font-size : 12px !important; a: \'!important\'}')
  result = await parser(fixture)
})

test('atRules are found correctly', t => {
  const expected = [{
    type: 'charset',
    params: '"UTF-8"'
  }, {
    type: 'import',
    params: '"some.css"'
  }, {
    type: 'supports',
    params: '(display: grid)'
  }, {
    type: 'media',
    params: 'screen'
  }, {
    type: 'media',
    params: '(min-width: 300px)'
  }]
  t.deepEqual(result.atRules, expected)
})

test('selectors are found correctly', t => {
  const expected = ['.foo', 'html', 'body']
  t.deepEqual(result.selectors, expected)
})

test('declarations are parsed correctly', t => {
  const expected = [{
    property: 'color',
    value: 'blue',
    important: false
  }, {
    property: 'color',
    value: 'red',
    important: false
  }, {
    property: 'font-size',
    value: '12px',
    important: true
  }, {
    property: 'a',
    value: '\'!important\'',
    important: false
  }]
  t.deepEqual(result.declarations, expected)
})

test('declarations per rule are counted', t => {
  const expected = [1, 3].map(num => {
    return {declarationsCount: num}
  })
  t.deepEqual(result.rules, expected)
})
