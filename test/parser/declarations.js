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
  const actual = await parser(fixture)
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

  t.deepEqual(actual.declarations, expected)
})

test('!important is parsed', async t => {
  const fixture = `html {
      color: red !important;
      content: '!important';
      color: blue;
    }
  `
  const actual = await parser(fixture)
  const expected = [
    {
      property: 'color',
      value: 'red',
      important: true
    },
    {
      property: 'content',
      value: "'!important'", // eslint-disable-line quotes
      important: false
    },
    {
      property: 'color',
      value: 'blue',
      important: false
    }
  ]

  t.deepEqual(actual.declarations, expected)
})

test('custom properties are parsed', async t => {
  const fixture = `
    :root {
      --my-custom-property: 12px;
      width: var(--my-custom-property);
    }
  `
  const actual = await parser(fixture)
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

  t.deepEqual(actual.declarations, expected)
})

test('calc() is parsed', async t => {
  const fixture = `
    .el {
      width: calc(100px + 3%);
      font-size: calc(3em + 20vmin);
    }
  `
  const actual = await parser(fixture)
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

  t.deepEqual(actual.declarations, expected)
})

test('browser hacks prefixes are not trimmed', async t => {
  const fixture = `
    .el {
      _color: blue;
      *zoom: 1;
    }
  `
  const actual = await parser(fixture)
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

  t.deepEqual(actual.declarations, expected)
})
