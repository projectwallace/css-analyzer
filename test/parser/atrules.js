const test = require('ava')
const parser = require('../../src/parser')

const FIXTURE = `
    /* FIXTURE */
    @charset "UTF-8";
    @import "some.css";
    @supports (display: grid) {
      @media screen {
        @media (min-width: 300px) {
        .foo { color:blue }
        }
      }
    }
  `

test('atRules are found correctly', async t => {
  const {atRules: actual} = await parser(FIXTURE)
  const expected = [
    {
      type: 'charset',
      params: '"UTF-8"'
    },
    {
      type: 'import',
      params: '"some.css"'
    },
    {
      type: 'supports',
      params: '(display: grid)'
    },
    {
      type: 'media',
      params: 'screen'
    },
    {
      type: 'media',
      params: '(min-width: 300px)'
    }
  ]
  t.deepEqual(actual, expected)
})

test('descriptors in @font-face are parsed to descriptors and not declarations', async t => {
  const fixture = `
    @font-face {
      src: url("http://example.com");
      font-family: MyFont;
    }
  `
  const {
    atRules: [fontface]
  } = await parser(fixture)
  const expected = {
    src: 'url("http://example.com")',
    'font-family': 'MyFont'
  }

  t.deepEqual(fontface.descriptors, expected)
  t.is(typeof fontface.declarations, 'undefined')
})
