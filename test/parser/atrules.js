const test = require('ava')
const parser = require('../../src/parser')

let fixture

test.beforeEach(() => {
  fixture = '/* FIXTURE */' +
    '@charset "UTF-8";' +
    '@import "some.css";' +
    '@supports (display: grid) { ' +
      '@media screen { ' +
        '@media (min-width: 300px) { ' +
          '.foo { color:blue } ' +
        '}' +
      '}' +
    '}'
})

test('atRules are found correctly', async t => {
  const actual = await parser(fixture)
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
  t.deepEqual(actual.atRules, expected)
})
