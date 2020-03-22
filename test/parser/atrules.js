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

test('@font-face atRules have declarations', async t => {
  const fixture = `
    @font-face {
      src: url(MOCK_URL);
      font-family: "MOCK";
      font-weight: normal;
    }
  `
  const {atRules: actual} = await parser(fixture)

  const expected = [
    {
      type: 'font-face',
      params: '',
      declarations: [
        {property: 'src', value: 'url(MOCK_URL)', important: false},
        {property: 'font-family', value: '"MOCK"', important: false},
        {property: 'font-weight', value: 'normal', important: false}
      ]
    }
  ]

  t.deepEqual(actual, expected)
})
