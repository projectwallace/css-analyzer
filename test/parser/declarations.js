const test = require('ava')
const parser = require('../../src/parser')

test('basic declarations are parsed', async t => {
  const fixture = `
    html, body {
      color:red;
      font-size : 12px;
      a: whatever;
    }
  `
  const {declarations: actual} = await parser(fixture)
  const expected = [
    {
      property: 'color',
      value: 'red',
      important: false
    },
    {
      property: 'font-size',
      value: '12px',
      important: false
    },
    {
      property: 'a',
      value: 'whatever',
      important: false
    }
  ]

  t.deepEqual(actual, expected)
})

test('!important is parsed', async t => {
  // eslint-disable-next-line unicorn/string-content
  const fixture = `html {
      color: red !important;
      content: '!important';
      font-size:16px!important;
      color: blue;
    }
  `
  const {declarations: actual} = await parser(fixture)
  const expected = [
    {
      property: 'color',
      value: 'red',
      important: true
    },
    {
      property: 'content',
      // eslint-disable-next-line quotes
      value: `'!important'`, // eslint-disable-line unicorn/string-content
      important: false
    },
    {
      property: 'font-size',
      value: '16px',
      important: true
    },
    {
      property: 'color',
      value: 'blue',
      important: false
    }
  ]

  t.deepEqual(actual, expected)
})

test('custom properties are parsed', async t => {
  const fixture = `
    :root {
      --my-custom-property: 12px;
      width: var(--my-custom-property);
    }
  `
  const {declarations: actual} = await parser(fixture)
  const expected = [
    {
      property: '--my-custom-property',
      value: '12px',
      important: false
    },
    {
      property: 'width',
      value: 'var(--my-custom-property)',
      important: false
    }
  ]

  t.deepEqual(actual, expected)
})

test('calc() is parsed', async t => {
  const fixture = `
    .el {
      width: calc(100px + 3%);
      font-size: calc(3em + 20vmin);
    }
  `
  const {declarations: actual} = await parser(fixture)
  const expected = [
    {
      property: 'width',
      value: 'calc(100px + 3%)',
      important: false
    },
    {
      property: 'font-size',
      value: 'calc(3em + 20vmin)',
      important: false
    }
  ]

  t.deepEqual(actual, expected)
})

test('browser hacks prefixes are not trimmed', async t => {
  const fixture = `
    .el {
      _color: blue;
      *zoom: 1;
    }
  `
  const {declarations: actual} = await parser(fixture)
  const expected = [
    {
      property: '_color',
      value: 'blue',
      important: false
    },
    {
      property: '*zoom',
      value: '1',
      important: false
    }
  ]

  t.deepEqual(actual, expected)
})

test('declarations inside at-rules are parsed', async t => {
  const {declarations: actual} = await parser(`
    a { color: red; }
    @media (min-width: 0) { color: red; }
    @media (print) { @media (max-width: 10px) { color: red; } }
  `)

  const expected = new Array(3).fill({
    property: 'color',
    value: 'red',
    important: false
  })

  t.deepEqual(actual, expected)
})
